import React from "react";
import DigitalChalan from "./DigitalChalan";

const PDFComponent = ({order, cafeData}) => {
  // const order = [{product : 'Cow Milk', quantity: 10, price : 88}, {product : 'Buffalo Milk', quantity: 20, price : 99}, {product : 'Goat Milk', quantity: 30, price : 77}, {product : 'Sheep Milk', quantity: 40, price : 66}];
  return (
    <div>
      <DigitalChalan  order={order} cafeData={cafeData}/>
    </div>
  );
};

export default PDFComponent;
