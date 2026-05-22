import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const formatDate = (date) => {
  if (!date) return "";
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const DateInput = ({ date, setDate, style }) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const defaultStyle = {
    position: "relative",
    display: "inline-block",
  };

  const inputStyle = {
    cursor: "pointer",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    ...style,
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setDate(date);
    setShowCalendar(false);
  };

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (!date || date === "" || new Date(date) < tomorrow) {
      setSelectedDate(tomorrow);
      setDate(tomorrow);
    } else {
      setSelectedDate(new Date(date));
    }

    return () => {
      setSelectedDate(null);
      setDate(null);
    };
  }, []);

  return (
    <div style={defaultStyle}>
      <p onClick={() => setShowCalendar((prev) => !prev)} style={inputStyle}>
        {formatDate(selectedDate)}
      </p>
      {showCalendar && (
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          inline
          onClickOutside={() => setShowCalendar(false)}
          minDate={tomorrow}
        />
      )}
    </div>
  );
};

export default DateInput;
