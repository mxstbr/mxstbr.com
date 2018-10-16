export type BookCategory = "tech" | "life" | "novels" | "coffee";

export type Book = {
  title: string,
  author: string,
  readAt: Date,
  category: BookCategory,
  rating: 1 | 2 | 3 | 4 | 5,
  review: string,
  href: string
};

const books: Array<Book> = [
  {
    title: "American Kingpin",
    category: "novels",
    readAt: new Date(2017, 5),
    author: "Nick Bilton",
    rating: 5,
    review:
      'The true story of Ross Ulbricht aka "Dead Pirate Roberts", the creator of Silk Road. Very packing tale, I could not put the book back down until I finished it.',
    href:
      "https://www.amazon.com/American-Kingpin-Criminal-Mastermind-Behind/dp/1591848148"
  },
  {
    title: "Masters of Doom",
    category: "tech",
    readAt: new Date(2017, 4),
    author: "David Kushner",
    rating: 4,
    review:
      "The true story of the two Johns, Carmack and Romero, and how they created two of the most successful game franchises ever, Doom and Quake.",
    href:
      "https://www.amazon.com/Masters-Doom-Created-Transformed-Culture/dp/0812972155"
  }
];

export default books;
