import React from "react";
import styled from "styled-components";
import { Flex, Box } from "rebass";
import { ThumbsUp, Twitter, ExternalLink, Headphones } from "react-feather";
import fetch from "isomorphic-unfetch";
import useModal from "use-react-modal";
import PageHeader from "../components/PageHeader";
import Paragraph from "../components/Paragraph";
import BoxShadow from "../components/BoxShadow";
import {
  TextButton as Button,
  default as NormalButton
} from "../components/Button";
import Card from "../components/Card";
import Text from "../components/Text";
import Link from "../components/Link";
import { ListDivider } from "../components/Lists";
import { H3 } from "../components/Heading";
import { URL } from "../utils/constants";

const PodcastIconImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 10px;
`;

const PodcastIcon = props => (
  <Box>
    <PodcastIconImage {...props} />
  </Box>
);

const SubscriptionOption = ({ href, name, icon }) => (
  <Flex
    flexDirection="column"
    alignItems="center"
    as="a"
    target="_blank"
    href={href}
    flex="1"
    css={{ textDecoration: "none" }}
  >
    <PodcastIcon src={icon} />
    <Text mt={1} fontSize={0} color="tertiary" textAlign="center">
      {name}
    </Text>
  </Flex>
);

const Avatar = styled.img.attrs(props => ({
  src: `https://avatars.io/twitter/${props.user}`
}))`
  height: 50px;
  border-radius: 50%;

  ${props =>
    props.currentUser === props.user &&
    `
    box-shadow: 0px 0px 0px 2px white, 0px 0px 0px 4px #3867d6;
  `}
`;

const UpvoteButton = styled(Box).attrs({
  as: "button",
  p: 2
})`
  align-items: center;
  justify-content: center;
  flex-direction: column;
  align-self: center;
  background-color: transparent;
  border: 1px solid ${props => props.borderColor};
  border-radius: 3px;
  color: ${props => props.theme.colors.black};
  cursor: pointer;
`;

const QuestionInputRules = styled(Text).attrs({
  fontSize: 0,
  px: 3,
  pb: 2
})`
  display: none;
  color: #999;
`;

const QuestionInput = styled(Box).attrs({
  as: "input",
  p: 3,
  pr: 0
})`
  width: 100%;
  border-radius: 3px;
  border: none;
  background-color: white;
  outline: none;
  font-size: 16px;

  &:focus ~ ${QuestionInputRules} {
    display: block;
  }
`;

const QuestionWrapper = styled(Flex).attrs({
  py: 3
})`
  border-bottom: 1px solid #eee;
  justify-content: space-between;
  position: relative;

  &:last-of-type {
    border-bottom: none;
  }
`;

const Question = ({ question, currentUser, openModal, onUpvote }) => {
  const viewerHasVoted = question.votes.find(
    ({ user }) => user === currentUser
  );
  return (
    <QuestionWrapper>
      <Box
        id={`q${question.id}`}
        css={{ position: "absolute", top: "-80px", left: 0 }}
      />
      <Flex>
        <Avatar user={question.user} currentUser={currentUser} />
        <Flex flexDirection="column" ml={3} mr={3}>
          <Text fontSize={2} mb={1}>
            <strong>@{question.user}</strong>
          </Text>
          <Paragraph fontSize={2} mb={0}>
            {question.content}
          </Paragraph>
          {question.answered_in_episode && (
            <Text
              as={Link}
              mt={2}
              href={question.answered_in_episode}
              color="#3867d6!important"
              fontSize={2}
            >
              Listen to the answer{" "}
              <Box
                as={Headphones}
                size="1em"
                css={{ verticalAlign: "bottom" }}
              />
            </Text>
          )}
        </Flex>
      </Flex>
      <UpvoteButton
        onClick={evt => {
          if (!currentUser) {
            openModal(evt);
            return;
          }

          fetch(`${URL}/api/questions/vote`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              questionId: question.id
            })
          });
          onUpvote && onUpvote();
        }}
        disabled={!!question.answered_in_episode}
        borderColor={viewerHasVoted ? "#3867d6" : "#eee"}
      >
        <ThumbsUp size="1.75em" stroke={viewerHasVoted ? "#3867d6" : "#666"} />
        <Text
          fontSize={1}
          fontWeight={viewerHasVoted ? "bold" : "normal"}
          color={viewerHasVoted ? "#3867d6" : "#666"}
        >
          {question.votes_aggregate.aggregate.count}
        </Text>
      </UpvoteButton>
    </QuestionWrapper>
  );
};

let optimisticId = 0;
const AMA = ({ questions: onlineQuestions, currentUser }) => {
  const [questions, setQuestions] = React.useState(onlineQuestions);
  const [value, setValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { isOpen, openModal, closeModal, Modal } = useModal({
    background: "rgba(0, 0, 0, 0.85)"
  });

  return (
    <>
      {isOpen && (
        <Modal>
          <Card
            hover={false}
            css={{ maxWidth: "550px" }}
            width={["98vw", "100vw"]}
            mx={[2, 0]}
          >
            <Card.Title>Sign in</Card.Title>
            <Card.Body mb={[2, 3]}>
              Sign in to ask and upvote questions.
              <Box mt={3} />
              <Box
                as="a"
                p={2}
                css={{
                  background: "#1da1f2",
                  color: "white",
                  display: "inline-block",
                  borderRadius: "3px",
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none",
                  "& svg": {
                    marginRight: "8px"
                  }
                }}
                href="/api/auth/twitter"
              >
                <Twitter size="1em" fill="currentColor" stroke="currentColor" />
                Sign in with Twitter
              </Box>
            </Card.Body>
            <Card.FinePrint>
              No data apart from your username, questions and votes will be
              stored.
            </Card.FinePrint>
          </Card>
        </Modal>
      )}
      <PageHeader
        title="Ask Max Anything Podcast"
        description="Upvote and ask questions for @mxstbr to answer in a future episode of the Ask Max Anything podcast."
        image="/static/images/ama.png"
      >
        <>
          <Paragraph centered>
            I record a weekly podcast where I answer the most upvoted question
            from this page. Ask me anything you want to know, upvote the
            questions you would like the answer to and{" "}
            <strong>subscribe in your favorite podcast player</strong>:
          </Paragraph>
          <Flex mt={2} justifyContent="space-between">
            <SubscriptionOption
              href="https://podcasts.apple.com/fr/podcast/ask-max-anything/id1488813808?l=en"
              icon="https://spec.fm/static/img/subscription_icons/podcasts.png"
              name="Apple"
            />
            <SubscriptionOption
              href="https://www.google.com/podcasts?feed=aHR0cHM6Ly9hbmNob3IuZm0vcy8xMDZlOGY0Yy9wb2RjYXN0L3Jzcw=="
              icon="https://spec.fm/static/img/subscription_icons/google-podcasts.png"
              name="Google"
            />
            <SubscriptionOption
              href="https://open.spotify.com/show/0CLRm2SV5shH3EyB1KOJl4"
              icon="/static/images/spotify.png"
              name="Spotify"
            />
            <SubscriptionOption
              href="https://pca.st/s00vpw8t"
              icon="https://spec.fm/static/img/subscription_icons/pocketcasts.png"
              name="Pocket Casts"
            />
            <SubscriptionOption
              href="https://overcast.fm/itunes1488813808/ask-max-anything"
              icon="https://spec.fm/static/img/subscription_icons/overcast.png"
              name="Overcast"
            />
            <SubscriptionOption
              href="https://www.breaker.audio/ask-max-anything"
              icon="https://spec.fm/static/img/subscription_icons/breaker.png"
              name="Breaker"
            />
            <SubscriptionOption
              href="https://anchor.fm/s/106e8f4c/podcast/rss"
              icon="https://spec.fm/static/img/subscription_icons/rss.png"
              name="RSS"
            />
          </Flex>
        </>
      </PageHeader>
      <Flex>
        {currentUser && <Avatar user={currentUser} currentUser={currentUser} />}
        <BoxShadow as={Flex} mb={3} ml={currentUser ? 3 : 0} width={1}>
          <Flex
            as="form"
            width={1}
            css={{
              background: "white",
              alignItems: "center",
              borderRadius: "3px"
            }}
            onSubmit={evt => {
              evt.preventDefault();
              if (loading || value.trim() === "" || !currentUser) return;

              setLoading(true);
              fetch(`${URL}/api/questions/ask`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  content: value.trim()
                })
              })
                .then(res => {
                  if (res.ok) {
                    setQuestions([
                      ...questions,
                      {
                        id: optimisticId++,
                        user: currentUser,
                        content: value.trim(),
                        votes: [{ user: currentUser }],
                        answered_in_episode: null,
                        votes_aggregate: {
                          aggregate: {
                            count: 1
                          }
                        }
                      }
                    ]);
                    setValue("");
                    setLoading(false);
                  }
                })
                .catch(err => {
                  setLoading(false);
                });
            }}
          >
            <Box width={1}>
              <QuestionInput
                value={value}
                disabled={!currentUser}
                onClick={evt => {
                  if (currentUser) return;

                  openModal(evt);
                }}
                onChange={evt => setValue(evt.target.value)}
                placeholder="Ask a question..."
                autoFocus={currentUser}
                disabled={loading}
              />
              <QuestionInputRules>
                280 characters per question · 5 questions max
              </QuestionInputRules>
            </Box>
            <Button type="submit" disabled={loading} p={3}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </Flex>
        </BoxShadow>
      </Flex>
      <ListDivider>
        <H3 mr={3} mt={2} mb={3}>
          Answered
        </H3>
      </ListDivider>
      <Card px={3} mb={4} hover={false}>
        {questions
          .filter(question => question.answered_in_episode)
          .sort(
            (a, b) =>
              b.votes_aggregate.aggregate.count -
              a.votes_aggregate.aggregate.count
          )
          .map(question => (
            <Question
              key={question.id}
              question={question}
              currentUser={currentUser}
              openModal={openModal}
            />
          ))}
      </Card>
      <ListDivider>
        <H3 mr={3} mt={2} mb={3}>
          New
        </H3>
      </ListDivider>
      <Card px={3} mb={4} hover={false}>
        {questions
          .filter(question => !question.answered_in_episode)
          .sort(
            (a, b) =>
              b.votes_aggregate.aggregate.count -
              a.votes_aggregate.aggregate.count
          )
          .map(question => (
            <Question
              key={question.id}
              question={question}
              currentUser={currentUser}
              openModal={openModal}
              onUpvote={() => {
                setQuestions(
                  questions.map(q => {
                    if (q.id !== question.id) return q;

                    const viewerHasVoted = q.votes.find(
                      ({ user }) => user === currentUser
                    );
                    return {
                      ...q,
                      votes: [...q.votes, { user: currentUser }],
                      votes_aggregate: {
                        ...q.votes_aggregate,
                        aggregate: {
                          ...q.votes_aggregate.aggregate,
                          count: viewerHasVoted
                            ? q.votes_aggregate.aggregate.count - 1
                            : q.votes_aggregate.aggregate.count + 1
                        }
                      }
                    };
                  })
                );
              }}
            />
          ))}
      </Card>
    </>
  );
};

AMA.getInitialProps = async ({ req }) => {
  const [questions, currentUser] = await Promise.all([
    fetch(`${URL}/api/questions`, {
      withCredentials: true,
      headers: {
        cookie: req && req.headers && req.headers.cookie
      }
    }).then(res => res.json()),
    fetch(`${URL}/api/user`, {
      withCredentials: true,
      headers: {
        cookie: req && req.headers && req.headers.cookie
      }
    }).then(res => res.text())
  ]);

  return {
    questions,
    currentUser
  };
};

export default AMA;
