import React from "react";
import {
  LazyLoadImage,
  trackWindowScroll
} from "react-lazy-load-image-component";
import "./List.css";

const List = ({ filter, graph, setSelected, scrollPosition }) => {
  const listings = graph.nodes.filter(node => {
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
        ? node.attributes.occupancy_cluster_string === filter.occupancycluster
        : true;
    return geocluster && pricecluster && occupancycluster;
  });

  return (
    <div className="listingContianer">
      {listings &&
        listings.length > 0 &&
        listings.map(listing => {
          return (
            <LazyLoadImage
              key={listing.id}
              className="listingBox"
              onClick={() => {
                setSelected(listing);
              }}
              src={`${listing.attributes.img_url}?aki_policy=small`}
              alt={listing.label}
              width={200}
              height={200}
              scrollPosition={scrollPosition}
            ></LazyLoadImage>
          );
        })}
    </div>
  );
};

export default trackWindowScroll(List);
