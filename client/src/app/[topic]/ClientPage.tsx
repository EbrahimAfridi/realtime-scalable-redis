"use client";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { useEffect, useState } from "react";
import { Wordcloud } from "@visx/wordcloud";
import { scaleLog } from "@visx/scale";
import { Text } from "@visx/text";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { submitComment } from "../actions";
import { ReloadIcon } from "@radix-ui/react-icons";
import { io } from "socket.io-client";

// Connecting to the server
const socket = io("http://localhost:8080");

interface ClientPageProps {
  topic: string;
  initialData: { text: string; value: number }[];
}

const COLORS = ["#143059", "#2F6B9A", "#82a6c2"];

const ClientPage = ({ topic, initialData }: ClientPageProps) => {
  const [words, setWords] = useState(initialData);
  const [input, setInput] = useState<string>("");

  useEffect(() => {
    socket.emit("join-room", `room:${topic}`);
  }, []);

  useEffect(() => {
    socket.on("room-update", (message: string) => {
      const data = JSON.parse(message) as {
        text: string;
        value: number;
      }[];

      data.map((newWord) => {
        const isWordPresent = words.some((word) => word.text === newWord.text);

        if (isWordPresent) {
          // increment the value of the word
          setWords((prev) => {
            const before = prev.find((word) => word.text === newWord.text);
            const rest = prev.filter((word) => word.text !== newWord.text);
            // timestamp: 2:12:36
            return [
              ...rest,
              { text: before!.text, value: before!.value + newWord.value },
            ];
          });
        } else if (words.length < 50) {
          // add state
          setWords((prev) => [...prev, newWord]);
        }
      });
    });

    // cleanup listner
    return () => {
      socket.off("room-update");
    };
  }, [words]);

  // Scaling the font size of the words based on the score they have in database
  // i.e. bigger words will have higher score (repeateation).
  const fontScale = scaleLog({
    domain: [
      Math.min(...words.map((w) => w.value)),
      Math.max(...words.map((w) => w.value)),
    ],
    range: [10, 100],
  });

  const { mutate, isPending } = useMutation({
    mutationFn: submitComment,
  });

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen bg-grid-zinc-50 pb-20">
      <MaxWidthWrapper className="flex flex-col items-center gap-6 pt-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-center text-balance tracking-tight">
          What people think about{" "}
          <span className="text-blue-600">{topic}</span>:
        </h1>

        <p className="text-sm">(updated in real-time)</p>

        <div className="aspect-square max-w-xl flex items-center justify-center">
          <Wordcloud
            words={words}
            width={500}
            height={500}
            // data is the word object
            fontSize={(data) => fontScale(data.value)}
            font={"Impact"}
            padding={2}
            spiral="archimedean" // just a style of word cloud
            rotate={0}
            random={() => 0.5}
            // here arrow function is used to return a value because it is a function
            // (idk real reason but it nit that important).
          >
            {(cloudWords) =>
              cloudWords.map((w, i) => (
                <Text
                  key={w.text}
                  fill={COLORS[i % COLORS.length]}
                  textAnchor="middle"
                  transform={`translate(${w.x}, ${w.y})`}
                  // transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
                  fontSize={w.size}
                  fontFamily={w.font}
                >
                  {w.text}
                </Text>
              ))
            }
          </Wordcloud>
        </div>

        <div className="max-w-lg w-full">
          <Label className="font-semibold tracking-tight text-lg pb-2">
            Here&apos;s what I think about {topic}
          </Label>
          <div className="mt-1 flex gap-2 items-center">
            <Input
              value={input}
              onChange={({ target }) => setInput(target.value)}
              placeholder={`${topic} is absolutely...`}
            />
            {isPending ? (
              <Button disabled>
                <ReloadIcon className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                <span className="text-xs md-text-sm">Please wait</span>
              </Button>
            ) : (
              <Button onClick={() => mutate({ comment: input, topic })}>
                Share
              </Button>
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
};

export default ClientPage;
