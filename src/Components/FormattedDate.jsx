import React from "react";

const FormattedDate = ({ value, type = "dateTime" }) => {
  if (!value) return <>--</>;

  let date;

  if (value.seconds !== undefined && value.nanoseconds !== undefined) {
    // Firestore timestamp
    date = new Date(value.seconds * 1000);
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string") {
    date = new Date(value);
  } else {
    return <>--</>;
  }

  // ❗ IMPORTANT: Prevent crash for invalid/malformed dates
  if (!date || isNaN(date.getTime())) {
    return <>--</>;
  }

  if (type === "date") {
    return <>{date.toISOString().split("T")[0]}</>;
  }

  return (
    <>
      {date.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    </>
  );
};

export default FormattedDate;
