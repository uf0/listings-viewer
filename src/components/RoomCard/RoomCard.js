import React from "react";
import "./RoomCard.css";

const dict = {
  "10": 10,
  "11": 9,
  "7": 8,
  "8": 7,
  "3": 6,
  "6": 5,
  "1": 4,
  "2": 3,
  "5": 2,
  "13": 1
};

const RoomCard = ({ selected }) => {
  const attributes = Object.entries(selected.attributes).filter(d => {
    return (
      d[0] !== "file_url" &&
      d[0] !== "file_original_name" &&
      d[0] !== "img_url" &&
      d[0] !== "occupancy_cluster"
    );
  });
  return (
    <div className="roomCardContainer">
      <img src={selected.attributes.img_url} alt={selected.label}></img>
      <table>
        <tbody>
          <tr>
            <td>ID</td>
            <td>
              <a
                href={`https://www.airbnb.com/rooms/${selected.label}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selected.label}
              </a>
            </td>
          </tr>
          {attributes.map(d => {
            return (
              <tr key={d[0]}>
                <td>{d[0]}</td>
                <td>
                  {d[1]}
                  {d[0] === "modularity" && <span> ({dict[d[1]]})</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RoomCard;
