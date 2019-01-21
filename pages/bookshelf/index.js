import React from "react";
import { Cpu, Heart, Star, BookOpen } from "react-feather";
import { format } from "date-fns";
import { Flex } from "rebass";
import PageHeader from "../../components/PageHeader";
import Head from "../../components/Head";
import Paragraph from "../../components/Paragraph";
import Icon from "../../components/Icon";
import Card from "../../components/Card";
import CardGrid from "../../components/CardGrid";
import WideSection from "../../components/WideSection";
import Text from "../../components/Text";
import Link from "../../components/Link";
import books, { type Book, type BookCategory } from "../../data/books";

type IconMap = {
  [key: BookCategory]: typeof Cpu | string
};

const ICONS: IconMap = {
  novels: BookOpen,
  life: Heart,
  tech: Cpu,
  coffee: "☕️"
};

const BookCard = ({ book }: { book: Book }) => {
  let CategoryIcon = ICONS[book.category];
  if (typeof CategoryIcon !== "string")
    CategoryIcon = (
      <Icon>
        <CategoryIcon size="1em" />
      </Icon>
    );
  return (
    <Link
      width={[1, "calc(50% - 16px)", "calc(33.3% - 16px)"]}
      m={[1, 2]}
      mb={2}
      href={book.href}
    >
      {" "}
      <Card>
        <Card.Title>
          “{book.title}” by {book.author} ({book.rating}
          <Icon>
            <Star size="1em" />
          </Icon>
          )
        </Card.Title>
        <Card.Body>{book.review}</Card.Body>
        <Flex justifyContent="space-between">
          <Card.FinePrint>Read in {format(book.readAt, "YYYY")}</Card.FinePrint>
          <Card.FinePrint title={book.category}>{CategoryIcon}</Card.FinePrint>
        </Flex>
      </Card>
    </Link>
  );
};

export default () => (
  <>
    <PageHeader title="My Bookshelf">
      <Paragraph centered>
        Inpspired by <Link href="https://sivers.org/book">Derek Sivers</Link>,
        these are my notes on some of the books I've read.
      </Paragraph>
    </PageHeader>
    <WideSection>
      <CardGrid>
        {books.map(book => (
          <BookCard key={`${book.title}-by-${book.author}`} book={book} />
        ))}
      </CardGrid>
    </WideSection>
  </>
);
