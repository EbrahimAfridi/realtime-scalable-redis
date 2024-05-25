import { redis } from "@/lib/redis";
import ClientPage from "./ClientPage";

interface PageProps {
  params: {
    topic: string;
  };
}

const Page = async ({ params }: PageProps) => {
  const { topic } = params;
  // zrange allows us to get data from a sorted set.
  // redis stores data in the form of key-value pairs. Here called as score-member pairs.
  // In this case, the key is `room:${topic}`.
  // The value is a sorted set of messages.
  // redis return data like [redis, 2, is, 3, wow, 8] here redis is a member and 2 is its score.
  // We are using withScores: true to get the score of each member.
  // 0 to 49 is the range of data we want to get. 
  const initialData = await redis.zrange<(string | number)[]>(
    `room:${topic}`,
     0,
      49,
      {
        withScores: true,
      }
    );
  // Checking how offent a word occures in the data.
  // Formating the data from redis in the form of {text: string, value: number}[].
  const words: {text: string, value: number}[] = [];

  for (let i = 0; i < initialData.length; i++) {
    const [text, value] = initialData.slice(i, i + 2);

    if (typeof text === "string" && typeof value === "number") {
      words.push({ text, value });
    }
  }

  await redis.incr("served-requests");

  return <ClientPage initialData={words} topic={topic}/>
};

export default Page;
