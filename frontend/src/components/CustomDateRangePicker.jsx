import React, { useEffect, useState } from 'react';
import { DateRangePicker } from 'react-date-range';

const CustomDateRangePicker = ({ onDateChange }) => {
    const [selectedRange, setSelectedRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: 'selection',
        },
    ]);
    const [showPicker, setShowPicker] = useState(false);

    const handleSelect = (ranges) => {
        setSelectedRange([ranges.selection]);
    };

    const togglePicker = () => {
        setShowPicker(!showPicker);
    };

    const handleSearchRange = () => {
        onDateChange(selectedRange[0].startDate, selectedRange[0].endDate);
        togglePicker();
    };
    useEffect(()=>{
        onDateChange(selectedRange[0].startDate, selectedRange[0].endDate);

        return () => {
            onDateChange(null, null);
            setSelectedRange([{
                startDate: new Date(),
                endDate: new Date(),
                key: 'selection',
            },])
        }
    }, [])

    return (
        <div className="h-auto w-full d-flex flex-column justify-content-end">
            <div className='d-flex flex-row justify-content-end align-items-center w-auto'> 
                <div
                    id="reportrange"
                    className="bg-white cursor-pointer p-2 border border-secondary rounded d-flex align-items-center"
                    onClick={togglePicker}
                >
                    <i className="fa fa-calendar me-2" />
                    <span>{`${selectedRange[0].startDate.toDateString()} - ${selectedRange[0].endDate.toDateString()}`}</span>
                    <i className="fa fa-caret-down ms-2" />
                </div>
            </div>
    {showPicker && (
        <div className="bg-light p-3 rounded shadow" style={{ width: "37rem", position: 'relative', zIndex: 2 }}>
            <DateRangePicker
                ranges={selectedRange}
                onChange={handleSelect}
                moveRangeOnFirstSelection={false}
                showDateDisplay={false}
                direction="vertical"
            />
            <div className="d-flex justify-content-end mt-3">
                <button
                    type="button"
                    className="btn btn-outline-danger btn-sm me-2"
                    onClick={togglePicker}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSearchRange}
                >
                    Search
                </button>
            </div>
        </div>
    )}
</div>
    );
};

export default CustomDateRangePicker;