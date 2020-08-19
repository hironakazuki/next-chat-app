import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { API, graphqlOperation } from "aws-amplify";

import { useAuth } from "../../auth";

import { createPost, deletePost } from "../../src/graphql/mutations";
import {
  onUpdateRoom,
  onCreatePost,
  onDeletePost,
} from "../../src/graphql/subscriptions";

import { getRoom } from "../../src/graphql/queries";
import { Post } from "../../types";
import {
  GetRoomQuery,
  OnUpdateRoomSubscription,
  OnCreatePostSubscription,
  OnDeletePostSubscription,
  CreatePostMutationVariables,
  DeletePostMutationVariables,
  UpdateRoomMutationVariables,
} from "../../src/API";
import {
  useStateValue,
  showRoom,
  updateRoomSubscription,
  createPostSubscription,
  deletePostSubscription,
} from "../../src/state";

import UpdateRoomModal from "../../components/UpdateRoomModal";

import GenericTemplate from "../../components/templates/GenericTemplate";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";

import Typography from "@material-ui/core/Typography";
import Chip from "@material-ui/core/Chip";
import Fab from "@material-ui/core/Fab";
import IconButton from "@material-ui/core/IconButton";
import CancelIcon from "@material-ui/icons/Cancel";
import CreateIcon from "@material-ui/icons/Create";
import DeleteIcon from "@material-ui/icons/Delete";

import { updateRoom } from "../../src/graphql/mutations";
import { RoomFormValues } from "../../components/AddRoomModal/AddRoomForm";

type RoomSubscriptionEvent = { value: { data: OnUpdateRoomSubscription } };

type createPostSubscriptionEvent = {
  value: { data: OnCreatePostSubscription };
};
type deletePostSubscriptionEvent = {
  value: { data: OnDeletePostSubscription };
};
type FormState = {
  content: string;
};

const useStyles = makeStyles({
  current: {
    justifyContent: "center",
    "& > *": {
      marginBottom: "0.5rem",
    },
    textAlign: "right",
  },
  currentChat: {
    backgroundColor: "#37c43c",
    color: "#ffffff",
  },
  other: {
    justifyContent: "center",
    "& > *": {
      marginBottom: "1rem",
    },
  },
  deleteIcon: {
    color: "#db2828",
  },
  deleteButton: {
    marginLeft: "1rem",

    backgroundColor: "#db2828",
    color: "#ffffff",
  },
});

const Home = () => {
  const auth = useAuth(null);
  const [{ room }, dispatch] = useStateValue();
  const [input, setInput] = useState<FormState>({
    content: "",
  });
  const [id, setId] = useState<string>();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();
  const openModal = (): void => {
    setModalOpen(true);
  };

  const closeModal = (): void => {
    setModalOpen(false);
    setError(undefined);
  };

  const router = useRouter();
  const classes = useStyles();
  useEffect(() => {
    // idがqueryで利用可能になったら処理される
    if (router.asPath !== router.route) {
      if (typeof router.query.id === "string") setId(router.query.id);
    }
  }, [router]);
  useEffect(() => {
    async function fetchData() {
      try {
        const roomData = await API.graphql({
          query: getRoom,
          variables: { id },
          // @ts-ignore
          authMode: "API_KEY",
        });
        if ("data" in roomData && roomData.data) {
          const room = roomData.data as GetRoomQuery;
          if (room.getRoom) {
            dispatch(showRoom(room));
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
    if (id) {
      fetchData();
    }

    const editRoomSubscription = API.graphql({
      query: onUpdateRoom,
      // @ts-ignore
      authMode: "API_KEY",
    }).subscribe({
      next: ({ value: { data } }: RoomSubscriptionEvent) => {
        if (data.onUpdateRoom && data.onUpdateRoom.id === id) {
          dispatch(updateRoomSubscription(data));
        }
      },
    });
    const newPostSubscription = API.graphql({
      query: onCreatePost,
      // @ts-ignore
      authMode: "API_KEY",
    }).subscribe({
      next: ({ value: { data } }: createPostSubscriptionEvent) => {
        if (data.onCreatePost && data.onCreatePost.roomID === id) {
          dispatch(createPostSubscription(data));
        }
      },
    });
    const destroyPostSubscription = API.graphql({
      query: onDeletePost,
      // @ts-ignore
      authMode: "API_KEY",
    }).subscribe({
      next: ({ value: { data } }: deletePostSubscriptionEvent) => {
        if (data.onDeletePost) {
          dispatch(deletePostSubscription(data));
        }
      },
    });
    return async () => {
      // Clean up the subscription
      await editRoomSubscription.unsubscribe();
      await newPostSubscription.unsubscribe();
      await destroyPostSubscription.unsubscribe();
    };
  }, [id]);
  const onFormChange = ({
    target: { name, value },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const createNewPost = async () => {
    if (input.content === "") return;
    const newPost: CreatePostMutationVariables = {
      input: {
        roomID: id,
        content: input.content,
      },
    };
    setInput({ content: "" });
    await API.graphql(graphqlOperation(createPost, newPost));
  };

  const deleteMyPost = (post: Post) => {
    // await API.graphql(graphqlOperation(createPost, newRoom));
    if (window.confirm(`${post.content}を削除しますか？`)) {
      const killPost: DeletePostMutationVariables = {
        input: {
          id: post.id,
        },
      };
      API.graphql(graphqlOperation(deletePost, killPost));
    }
  };

  const editRoom = async (values: RoomFormValues) => {
    try {
      const [id, title, description] = [
        room.id,
        values.title,
        values.description,
      ];
      const newRoom: UpdateRoomMutationVariables = {
        input: {
          id,
          title,
          description,
        },
      };
      closeModal();
      await API.graphql(graphqlOperation(updateRoom, newRoom));
    } catch (e) {
      console.error(e.response.data);
      setError(e.response.data.error);
    }
  };
  return (
    <GenericTemplate title={""}>
      {auth?.accessTokenData?.username === room?.owner && (
        <>
          <UpdateRoomModal
            modalOpen={modalOpen}
            onSubmit={editRoom}
            error={error}
            onClose={closeModal}
            room={room}
          />
          <div>
            <Fab
              size="small"
              color="primary"
              aria-label="edit"
              onClick={() => openModal()}
            >
              <CreateIcon />
            </Fab>
            <Fab
              size="small"
              color="inherit"
              aria-label="delete"
              className={classes.deleteButton}
            >
              <DeleteIcon />
            </Fab>
          </div>
        </>
      )}

      {room ? (
        <div>
          <Typography variant="h4" component="h2">
            {room.title}
          </Typography>
          <Typography color="textSecondary">{room.description}</Typography>
          {room.posts.items.map((post) => {
            if (auth?.accessTokenData?.username === post.owner) {
              return (
                <div className={classes.current} key={post.id}>
                  <span>{post.owner}</span>
                  <Chip label={post.content} className={classes.currentChat} />
                  <IconButton
                    className={classes.deleteIcon}
                    onClick={() => {
                      deleteMyPost(post);
                    }}
                  >
                    <CancelIcon />
                  </IconButton>
                  <br />
                </div>
              );
            } else {
              return (
                <div className={classes.other} key={post.id}>
                  <span>{post.owner}</span>
                  <Chip label={post.content} />
                  <br />
                </div>
              );
            }
          })}
        </div>
      ) : (
        <p>Add some Posts!</p>
      )}
      {auth && (
        <>
          <div>
            <TextField
              value={input.content}
              label="チャット"
              name="content"
              fullWidth
              onChange={onFormChange}
            />
            <Button
              onClick={createNewPost}
              variant="contained"
              color="primary"
              style={{ float: "right" }}
            >
              送信
            </Button>
          </div>
        </>
      )}
    </GenericTemplate>
  );
};

export default Home;
