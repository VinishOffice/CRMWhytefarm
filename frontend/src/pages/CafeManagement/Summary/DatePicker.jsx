import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const DatePicker = ({ selectedDate, setSelectedDate }) => {
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const handleDateClick = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setCalendarOpen(false);
  };

  const renderCalendar = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const days = daysInMonth(month + 1, year);

    const firstDay = new Date(year, month, 1).getDay();
    const calendarDays = [];

    // Fill empty slots before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="col empty-day"></div>);
    }

    // Fill the calendar with days of the month
    for (let day = 1; day <= days; day++) {
      calendarDays.push(
        <div
          key={day}
          className="col day text-center"
          onClick={() => handleDateClick(day)}
          style={{ cursor: 'pointer', padding: '10px', borderRadius: '4px', transition: 'background-color 0.2s' }}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="card" style={{ position: 'absolute', top: '40px', left: '0', zIndex: 1 }}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>{currentDate.toLocaleString('default', { month: 'long' })} {year}</span>
          <div>
            <button className="btn btn-link" onClick={() => setCurrentDate(new Date(year, month - 1))}>{"<"}</button>
            <button className="btn btn-link" onClick={() => setCurrentDate(new Date(year, month + 1))}>{">"}</button>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            {calendarDays}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="position-relative d-inline-block">
      <h2>Select a Date</h2>
      <input
        type="text"
        value={selectedDate ? selectedDate.toLocaleDateString('en-GB') : ''}
        readOnly
        onClick={() => setCalendarOpen(!isCalendarOpen)}
        placeholder="Select a date"
        className="form-control"
        style={{ cursor: 'pointer' }}
      />
      {isCalendarOpen && renderCalendar()}
    </div>
  );
};

export default DatePicker;