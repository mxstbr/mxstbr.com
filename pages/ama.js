import React from "react";
import styled from "styled-components";
import { Flex } from "rebass";
import { ThumbsUp } from "react-feather";
import PageHeader from "../components/PageHeader";
import Paragraph from "../components/Paragraph";
import BoxShadow from "../components/BoxShadow";
import Text from "../components/Text";
import { ListDivider } from "../components/Lists";
import { H3 } from "../components/Heading";

const questions = [
  {
    content:
      "GitHub or GitLab ? Which one for which usage ? What do you advise for innersource purposes ?",
    author: "brian_lovin",
    votes: ["mxstbr", "brian_lovin"]
  },
  {
    content:
      "You do a lot of different things. Would you have some tips to share with us in Time Management?",
    author: "brian_lovin",
    votes: ["brian_lovin"]
  }
];

const Avatar = styled.img`
  height: 50px;
  border-radius: 50%;
`;

const UpvoteButton = styled(BoxShadow).attrs({
  as: "button",
  p: 2
})`
  align-items: center;
  justify-content: center;
  flex-direction: column;
  align-self: center;
  background-color: white;
  border: none;
  border-radius: 3px;
`;

const QuestionInput = styled(BoxShadow).attrs({
  as: "input",
  p: 3,
  mb: 5
})`
  width: 100%;
  border-radius: 3px;
  border: none;
  background-color: white;
  outline: none;
  font-size: 16px;
`;

const currentUser = "mxstbr";

const Question = ({ question }) => (
  <Flex mb={4}>
    <Avatar src={`https://avatars.io/twitter/${question.author}`} />
    <Flex flexDirection="column" ml={2} mr={3}>
      <Text fontSize={2} mb={1}>
        <strong>@{question.author}</strong> asks...
      </Text>
      <Paragraph fontSize={2} mb={0}>
        {question.content}
      </Paragraph>
    </Flex>
    <UpvoteButton>
      <ThumbsUp
        stroke={
          question.votes.indexOf(currentUser) > -1 ? "#3867d6" : "currentColor"
        }
      />
      <Text
        fontSize={1}
        fontWeight={
          question.votes.indexOf(currentUser) > -1 ? "bold" : "normal"
        }
        mt={1}
        color={question.votes.indexOf(currentUser) > -1 ? "#3867d6" : "#333"}
      >
        {question.votes.length}
      </Text>
    </UpvoteButton>
  </Flex>
);

export default () => {
  const [value, setValue] = React.useState("");

  return (
    <>
      <PageHeader title="Ask Me Anything Podcast">
        <Paragraph centered>
          I record a <a href="#">weekly podcast</a> where I answer the most
          upvoted questions from this page. Feel free to submit new ones or vote
          on existing ones!
        </Paragraph>
      </PageHeader>
      <Flex backgroundColor="white">
        <QuestionInput
          value={value}
          onChange={evt => setValue(evt.target.value)}
          placeholder="Ask a question..."
          autoFocus
        />
      </Flex>
      {questions
        .filter(question => question.answered !== true)
        .sort((a, b) => b.votes.length - a.votes.length)
        .map(question => (
          <Question question={question} />
        ))}
      <ListDivider>
        <H3 mr={3} mt={2} mb={2}>
          Answered
        </H3>
      </ListDivider>
      {questions
        .filter(question => question.answered === true)
        .sort((a, b) => b.votes.length - a.votes.length)
        .map(question => (
          <Question question={question} />
        ))}
    </>
  );
};
