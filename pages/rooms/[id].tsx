import React, { useEffect, useState } from "react";
import Head from "next/head";

import { useRouter } from "next/router";
import { API, graphqlOperation } from "aws-amplify";
import { Observable } from "../../node_modules/zen-observable-ts";

import { useAuth } from "../../auth";
import Link from "../../components/templates/Link";

import { Field, Formik, Form } from "formik";
import { TextField } from "../../components/AddRoomModal/FormField";
import { Grid, Button } from "semantic-ui-react";

import {
  createPost,
  deletePost,
  deleteRoom,
} from "../../src/graphql/mutations";
import {
  onUpdateRoom,
  onDeleteRoom,
  onCreatePost,
  onDeletePost,
} from "../../src/graphql/subscriptions";

import { getRoom } from "../../src/graphql/queries";
import { Post, GetRoom } from "../../types";
import {
  GetRoomQuery,
  OnUpdateRoomSubscription,
  OnCreatePostSubscription,
  OnDeletePostSubscription,
  OnDeleteRoomSubscription,
  CreatePostMutationVariables,
  DeletePostMutationVariables,
  UpdateRoomMutationVariables,
  DeleteRoomMutationVariables,
} from "../../src/API";
import {
  useStateValue,
  showRoom,
  updateRoomSubscription,
  deleteRoomSubscription,
  createPostSubscription,
  deletePostSubscription,
} from "../../src/state";

import UpdateRoomModal from "../../components/UpdateRoomModal";

import GenericTemplate from "../../components/templates/GenericTemplate";
import { makeStyles } from "@material-ui/core/styles";

import Typography from "@material-ui/core/Typography";
import Chip from "@material-ui/core/Chip";
import Fab from "@material-ui/core/Fab";
import IconButton from "@material-ui/core/IconButton";
import CancelIcon from "@material-ui/icons/Cancel";
import CreateIcon from "@material-ui/icons/Create";
import DeleteIcon from "@material-ui/icons/Delete";
import SendIcon from "@material-ui/icons/Send";

import { updateRoom } from "../../src/graphql/mutations";
import { RoomFormValues } from "../../components/AddRoomModal/AddRoomForm";

type UpdateRoomSubscriptionEvent = {
  value: { data: OnUpdateRoomSubscription };
};
type deleteRoomSubscriptionEvent = {
  value: { data: OnDeleteRoomSubscription };
};
type createPostSubscriptionEvent = {
  value: { data: OnCreatePostSubscription };
};
type deletePostSubscriptionEvent = {
  value: { data: OnDeletePostSubscription };
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
  chatField: {
    height: "40rem",
    backgroundColor: "#fffff0",
    overflow: "scroll",
  },
});

const Home = () => {
  const auth = useAuth(null);
  const [{ room }, dispatch] = useStateValue();
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

    const editRoomPubSubClient = API.graphql({
      query: onUpdateRoom,
      // @ts-ignore
      authMode: "API_KEY",
    }) as Observable<object>;
    const editRoomSubscription = editRoomPubSubClient.subscribe({
      next: ({ value: { data } }: UpdateRoomSubscriptionEvent) => {
        if (data.onUpdateRoom && data.onUpdateRoom.id === id) {
          dispatch(updateRoomSubscription(data));
        }
      },
    });
    const destroyRoomPubSubClient = API.graphql({
      query: onDeleteRoom,
      // @ts-ignore
      authMode: "API_KEY",
    }) as Observable<object>;
    const destroyRoomSubscription = destroyRoomPubSubClient.subscribe({
      next: ({ value: { data } }: deleteRoomSubscriptionEvent) => {
        if (data.onDeleteRoom && data.onDeleteRoom.id === id) {
          dispatch(deleteRoomSubscription(data));
        }
      },
    });
    const newPostPubSubClient = API.graphql({
      query: onCreatePost,
      // @ts-ignore
      authMode: "API_KEY",
    }) as Observable<object>;
    const newPostSubscription = newPostPubSubClient.subscribe({
      next: ({ value: { data } }: createPostSubscriptionEvent) => {
        if (data.onCreatePost && data.onCreatePost.roomID === id) {
          dispatch(createPostSubscription(data));
        }
      },
    });
    const destroyPostPubSubClient = API.graphql({
      query: onDeletePost,
      // @ts-ignore
      authMode: "API_KEY",
    }) as Observable<object>;
    const destroyPostSubscription = destroyPostPubSubClient.subscribe({
      next: ({ value: { data } }: deletePostSubscriptionEvent) => {
        if (data.onDeletePost) {
          dispatch(deletePostSubscription(data));
        }
      },
    });
    return async () => {
      // Clean up the subscription
      await editRoomSubscription.unsubscribe();
      await destroyRoomSubscription.unsubscribe();
      await newPostSubscription.unsubscribe();
      await destroyPostSubscription.unsubscribe();
    };
  }, [id]);

  const deleteMyPost = (post: Post) => {
    if (window.confirm(`${post.content}を削除しますか？`)) {
      const killPost: DeletePostMutationVariables = {
        input: {
          id: post.id,
        },
      };
      API.graphql(graphqlOperation(deletePost, killPost));
    }
  };

  const deleteMyRoom = (room: GetRoom) => {
    // await API.graphql(graphqlOperation(createPost, newRoom));
    if (window.confirm(`${room.title}を削除しますか？`)) {
      const killRoom: DeleteRoomMutationVariables = {
        input: {
          id: room.id,
        },
      };
      API.graphql(graphqlOperation(deleteRoom, killRoom));
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
  if (!room) {
    return (
      <>
        <Head>
          <title>ルームが見つかりません | next-chat-app</title>
        </Head>
        <GenericTemplate title={""}>
          <div>ルームが見つかりません</div>
          <Link href="/" as={`/`}>
            <div>TOPに戻る</div>
          </Link>
        </GenericTemplate>
      </>
    );
  }
  return (
    <>
      <Head>
        <title>{room.title} | next-chat-app</title>
      </Head>
      <GenericTemplate title={""}>
        <div>
          {auth?.accessTokenData?.username === room.owner && (
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
                  onClick={() => deleteMyRoom(room)}
                  className={classes.deleteButton}
                >
                  <DeleteIcon />
                </Fab>
              </div>
            </>
          )}
          <Typography variant="h4" component="h2">
            {room.title}
          </Typography>
          <Typography color="textSecondary">{room.description}</Typography>
          <div className={classes.chatField}>
            {room.posts.items.map((post) => {
              if (auth?.accessTokenData?.username === post.owner) {
                return (
                  <div className={classes.current} key={post.id}>
                    <Chip
                      label={post.content}
                      className={classes.currentChat}
                    />
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
                    <br />
                    <Chip label={post.content} />
                    <br />
                  </div>
                );
              }
            })}
          </div>
        </div>
        {auth ? (
          <>
            <Formik
              initialValues={{
                content: "",
              }}
              onSubmit={async (values, { resetForm }) => {
                try {
                  const [content] = [values.content];
                  const newPost: CreatePostMutationVariables = {
                    input: {
                      roomID: id,
                      content: content,
                    },
                  };
                  resetForm();
                  await API.graphql(graphqlOperation(createPost, newPost));
                } catch (e) {
                  console.error(e.response.data);
                  setError(e.response.data.error);
                }
              }}
              validate={(values) => {
                const requiredError = "Field is required";
                const errors: { [field: string]: string } = {};
                if (!values.content) {
                  errors.name = requiredError;
                }
                return errors;
              }}
            >
              {({ isValid, dirty }) => {
                return (
                  <Form className="form ui">
                    <Field
                      // label="Content"
                      // placeholder="Content"
                      name="content"
                      component={TextField}
                    />
                    <Grid>
                      <Grid.Column floated="right" width={5}>
                        <Button
                          type="submit"
                          floated="right"
                          color="green"
                          disabled={!dirty || !isValid}
                        >
                          {/* Add */}
                          <SendIcon />
                        </Button>
                      </Grid.Column>
                    </Grid>
                  </Form>
                );
              }}
            </Formik>
          </>
        ) : (
          <div>ログインしてチャットに参加しよう！</div>
        )}
      </GenericTemplate>
    </>
  );
};

export default Home;
