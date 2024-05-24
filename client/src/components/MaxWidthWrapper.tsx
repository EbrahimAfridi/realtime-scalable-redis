import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

// This wrapper is used give even padding and margins to components.
const MaxWidthWrapper = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  // cn is used to pass in default classes and custom classes that will always be applied to the div below.
  return (
    <div
      className={cn(
        "h-full w-full mx-auto max-w-screen-xl px-2.5 md:px-20",
        className // This is where the custom classes are passed in cn helps to merge these classes.
      )}
    >
      {children}
    </div>
  );
};

export default MaxWidthWrapper;
