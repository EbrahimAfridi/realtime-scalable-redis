"use client";
import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const TopicCreator = () => {
  const [input, setInput] = useState<string>("");

  return (
    <div className="mt-12 flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          onChange={({target}) => setInput(target.value)}
          value={input}
          className="bg-white min-w-64"
          placeholder="Enter topic here..."
        />
        <Button>Create</Button>
      </div>
    </div>
  );
};

export default TopicCreator;
