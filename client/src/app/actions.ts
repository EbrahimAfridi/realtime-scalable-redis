'use server'

import { redis } from "@/lib/redis";
import { redirect } from "next/navigation"

// This file has our server actions we cannot perform these server actions on the client side.
// Server Actions are asynchronous functions that are executed on the server. They can be used in Server 
// and Client Components to handle form submissions and data mutations in Next.js applications.
export const createTopic = async ({topic}: {topic: string}) => {
  // Validating whether the topic name is between 1 and 50 characters or not,
  // and whether it only contains letters and dashes

  const regex = /^[a-zA-Z-]+$/

  if (!topic || topic.length > 50) {
    return {error: "Topic name must be between 1 and 50 characters"};
  }

  if (!regex.test(topic)) {
    return {error: "Topic name must only contain letters and dashes"};
  }

  await redis.sadd("existing-topics", topic);

  redirect(`/${topic}`);

}

function wordFreq(text: string): {text: string, value: number}[] {
  // creating array by splitting the text by spaces, removing dots.
  const words: string[] = text.replace(/\./g, '').split(/\s/);
  // creating a frequency map which just an object with word as key and its frequency as value.
  const freqMap: Record<string, number> = {};

  // here we are adding frequency of words in the freqMap. 
  // Ex: "hello world." turns it into hello = 1, world = 1
  for (const w of words) {
    if (!freqMap[w]) freqMap[w] = 0;
    freqMap[w] += 1;
  }

  // Object.keys(freqMap): Is a built-in JS method that returns an array of a given object's own enumerable property names
  // first it will create an array of keys and then map over it to create an array of objects with text and value.
  return Object.keys(freqMap).map((word) => ({ text: word, value: freqMap[word] }));
}

export const submitComment = async ({ comment, topic }: {comment: string, topic: string}) => {
  const words = wordFreq(comment);

  await Promise.all(words.map(async (word) => {
    await redis.zadd(`room:${topic}`, {incr: true}, {member: word.text, score: word.value});
  }));

  await redis.incr("served-requests");

  await redis.publish(`room:${topic}`, words);

  return comment;
};