import React from "react";
import { Sigma, NodeShapes, Filter } from "react-sigma";
import "./Network.css";

const Network = ({ graph, filter, setSelected }) => {
  return (
    <Sigma
      renderer="canvas"
      style={{ width: "100%", height: "100%" }}
      graph={graph}
      settings={{ zoomMin: 0.00001 }}
      onClickNode={e => {
        setSelected(e.data.node);
        //window.open("https://www.airbnb.com/rooms/" + e.data.node.label);
      }}
    >
      {/*<NodeShapes default="circle" />*/}

      <Filter
        nodesBy={node => {
          const geocluster =
            filter && filter.geocluster
              ? node.attributes.geocluster === filter.geocluster
              : true;
          const pricecluster =
            filter && filter.pricecluster
              ? node.attributes.price_cluster === filter.pricecluster
              : true;

          const occupancycluster =
            filter && filter.occupancycluster
              ? node.attributes.occupancy_cluster_string ===
                filter.occupancycluster
              : true;
          return geocluster && pricecluster && occupancycluster;
        }}
      ></Filter>
    </Sigma>
  );
};

export default Network;
