import React, { useState } from "react";
import { quadtree } from "d3-quadtree";
import { Form, Field } from "react-final-form";
import Geocode from "react-geocode";
import Network from "./components/Network";
import RoomCard from "./components/RoomCard";
import List from "./components/List";
import "./App.css";
import graph from "./networkMerged.json";

Geocode.setApiKey(process.env.REACT_APP_GOOGLE_MAP);

const test = graph;

test.nodes = test.nodes.map(n => {
  delete n.type;
  if (n.attributes.occupancy_cluster) {
    n.attributes.occupancy_cluster_string = n.attributes.occupancy_cluster.join(
      "|"
    );
  }

  // delete n.color;
  //n.image = 1.2;
  // if (n.image) {
  //   //n.image.clip = 1;
  //   n.image.scale = 2.5;
  //   n.image.w = 1000;
  //   n.image.h = 600;
  //   n.image.url = "http://localhost:1337" + n.attributes.file_url;
  // }
  return n;
});
//.slice(0, 10);

const priceClusterIntervals = [
  { cluster: "6", min: 1.5, max: 7.7 },
  { cluster: "12", max: 13.4, min: 8.8 },
  { cluster: "15", max: 16.3, min: 13.4 },
  { cluster: "18", max: 18.9, min: 16.4 },
  { cluster: "20", max: 21.9, min: 19.0 },
  { cluster: "23", max: 25.2, min: 22.0 },
  { cluster: "27", max: 28.9, min: 25.2 },
  { cluster: "31", max: 33.9, min: 29.0 },
  { cluster: "37", max: 41.4, min: 34.0 },
  { cluster: "46", max: 53.8, min: 41.5 },
  { cluster: "62", max: 88.0, min: 54.0 },
  { cluster: "115", max: 194.0, min: 89.0 },
  { cluster: "284", max: 504.0, min: 202.7 }
];

const occupancyClusterIntervals = [
  {
    cluster: "0|0",
    min_acc_bath: -0.17,
    max_acc_bath: 0.88,
    min_acc_bed: -0.29,
    max_acc_bed: 0.38
  },
  {
    cluster: "0|1",
    min_acc_bath: -0.79,
    max_acc_bath: 0.67,
    min_acc_bed: 0.58,
    max_acc_bed: 3.33
  },
  {
    cluster: "0|5",
    min_acc_bath: -0.56,
    max_acc_bath: 2.84,
    min_acc_bed: 3.62,
    max_acc_bed: 11.15
  },
  {
    cluster: "1|1",
    min_acc_bath: 0.33,
    max_acc_bath: 2,
    min_acc_bed: 0,
    max_acc_bed: 1.96
  },
  {
    cluster: "2|",
    min_acc_bath: 0.67,
    max_acc_bath: 8.33,
    min_acc_bed: 0,
    max_acc_bed: 3.08
  },
  {
    cluster: "3|4",
    min_acc_bath: 0.99,
    max_acc_bath: 11.44,
    min_acc_bed: 2.76,
    max_acc_bed: 8.47
  },
  {
    cluster: "7|20",
    min_acc_bath: 0.33,
    max_acc_bath: 59,
    min_acc_bed: 11.15,
    max_acc_bed: 35.33
  },
  {
    cluster: "-0.5|0",
    min_acc_bath: -0.91,
    max_acc_bath: -0.36,
    min_acc_bed: -0.29,
    max_acc_bed: 0.04
  },
  {
    cluster: "-0.5|-0.5",
    min_acc_bath: -0.89,
    max_acc_bath: -0.02,
    min_acc_bed: 0.04,
    max_acc_bed: 0.83
  },
  {
    cluster: "-1|-1",
    min_acc_bath: -1.5,
    max_acc_bath: -0.63,
    min_acc_bed: -1.42,
    max_acc_bed: -0.42
  }
];

function App() {
  const listingsQT = quadtree()
    .x(n => n.attributes.longitude)
    .y(n => n.attributes.latitude)
    .addAll(test.nodes);

  const [list, setList] = useState(false);
  const [addressNotFound, setAddressNotFound] = useState(false);
  const [filter, setFilter] = useState(null);
  // const [priceClusters, setPriceClusters] = useState(null);
  const [selected, setSelected] = useState(null);

  const onSubmit = async values => {
    try {
      setAddressNotFound(false);
      const response = await Geocode.fromAddress(values.adderess);
      if (response.status === "OK") {
        const lngLat = [
          response.results[0].geometry.location.lng,
          response.results[0].geometry.location.lat
        ];
        const nearest = listingsQT.find(lngLat[0], lngLat[1]);
        setFilter({ ...filter, geocluster: nearest.attributes.geocluster });
      }
    } catch (e) {
      setAddressNotFound(true);
      console.log(e);
    }
  };

  const closest = (arr, closestTo) => {
    var closest = Math.max.apply(null, arr); //Get the highest number in arr in case it match nothing.
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] >= closestTo && arr[i] < closest) closest = arr[i]; //Check if it's higher than your number, but lower than your closest value
    }
    return closest; // return the value
  };

  const getClusterFromPrice = (price, clusters) => {
    const cl = clusters.find(d => {
      return d.max > price;
    });
    return +cl.cluster;
  };

  const getClusterFromDeltas = (deltas, clusters) => {
    const cl = clusters.find(d => {
      return (
        deltas.acc_bath >= d.min_acc_bath &&
        deltas.acc_bath <= d.max_acc_bath &&
        (deltas.acc_bed >= d.min_acc_bed && deltas.acc_bed <= d.max_acc_bed)
      );
    });
    return cl ? cl.cluster : null; //che fare?
  };

  const onSubmitPrice = values => {
    const people = values.people ? +values.people : 1;
    const pricePerDay = +values.price / people / 30;

    const inputCluster = getClusterFromPrice(
      pricePerDay,
      priceClusterIntervals
    );

    //get available clusters

    let mapping = [];

    if (filter && filter.geocluster) {
      mapping = test.nodes
        .filter(d => d.attributes.geocluster === filter.geocluster)
        .map(d => d.attributes.price_cluster);
    } else {
      mapping = test.nodes
        //.filter(d => d.attributes.geocluster === filter.geocluster)
        .map(d => d.attributes.price_cluster);
    }

    const availableClusters = [...new Set(mapping)]
      .sort(function(a, b) {
        return a - b;
      })
      .filter(d => d !== undefined);

    const pricecluster = closest(availableClusters, inputCluster);

    setFilter({ ...filter, pricecluster });
  };

  const computeDeltas = values => {
    const ACCOMDATION = 4;
    const BATHROOM = 1;
    const BEDROOM = 2;

    const acc_bath =
      ((+values.accomodates / ACCOMDATION) *
        (+values.accomodates - ACCOMDATION + 2)) /
        (((+values.bathrooms + 1) / (BATHROOM + 1)) *
          (+values.bathrooms - BATHROOM + 2)) -
      1;

    const acc_bed =
      ((+values.accomodates / ACCOMDATION) *
        (+values.accomodates - ACCOMDATION + 2)) /
        (((+values.beds + 1) / (BEDROOM + 1)) * (+values.beds - BEDROOM + 3)) -
      1;

    const occupancycluster = getClusterFromDeltas(
      { acc_bath, acc_bed },
      occupancyClusterIntervals
    );

    let mapping = [];

    mapping = test.nodes.filter(d => {
      const geocluster =
        filter && filter.geocluster
          ? d.attributes.geocluster === filter.geocluster
          : true;
      const pricecluster =
        filter && filter.pricecluster
          ? d.attributes.price_cluster === filter.pricecluster
          : true;

      const occupancyclusterPrivate =
        filter && filter.occupancycluster
          ? d.attributes.occupancy_cluster_string === occupancycluster
          : true;
      return geocluster && pricecluster && occupancyclusterPrivate;
    });

    if (mapping.length > 0) {
      setFilter({ ...filter, occupancycluster });
    }

    //che fare anche se non c'è nel filtro
    //setFilter({ ...filter, occupancycluster });
  };

  return (
    <div className="App">
      <div className="networkContainer">
        <button
          className="switchButton"
          onClick={() => {
            setList(!list);
          }}
        >
          {list ? "Network view" : "List view"}
        </button>
        {list ? (
          <List graph={test} filter={filter} setSelected={setSelected}></List>
        ) : (
          <Network
            graph={test}
            filter={filter}
            setSelected={setSelected}
          ></Network>
        )}
      </div>
      <div className="inputContainer">
        <Form
          onSubmit={onSubmit}
          render={({ handleSubmit, form, submitting, pristine, values }) => (
            <form onSubmit={handleSubmit}>
              <div className="formContainer">
                <h6>
                  geo
                  {filter && filter.geocluster && (
                    <span>
                      : <span className="red">{filter.geocluster}</span>
                    </span>
                  )}
                </h6>
                <p>
                  <label>Address: </label>
                  <Field
                    name="adderess"
                    component="input"
                    type="text"
                    placeholder="Write your address"
                  />
                </p>
                <button type="submit" disabled={submitting || pristine}>
                  Submit
                </button>
                {addressNotFound && <p>Address not found, try again</p>}
              </div>
            </form>
          )}
        />

        <Form
          onSubmit={onSubmitPrice}
          render={({ handleSubmit, form, submitting, pristine, values }) => (
            <form onSubmit={handleSubmit}>
              <div className="formContainer">
                <h6>
                  price
                  {filter && filter.pricecluster && (
                    <span>
                      : <span className="red">{filter.pricecluster}</span>
                    </span>
                  )}
                </h6>
                <p>
                  <label>Price per month: </label>
                  <Field name="price" component="input" type="number"></Field>
                </p>

                <p>
                  <label>People: </label>
                  <Field name="people" component="input" type="number"></Field>
                </p>

                <button type="submit" disabled={submitting || pristine}>
                  Submit
                </button>
              </div>
            </form>
          )}
        />

        <Form
          onSubmit={computeDeltas}
          render={({ handleSubmit, form, submitting, pristine, values }) => (
            <form onSubmit={handleSubmit}>
              <div className="formContainer">
                <h6>
                  occupancy
                  {filter && filter.occupancycluster && (
                    <span>
                      : <span className="red">{filter.occupancycluster}</span>
                    </span>
                  )}
                </h6>
                <p>
                  <label>accomodates: </label>
                  <Field
                    name="accomodates"
                    component="input"
                    type="number"
                  ></Field>
                </p>
                <p>
                  <label>bedrooms: </label>
                  <Field name="beds" component="input" type="number"></Field>
                </p>
                <p>
                  <label>bathrooms: </label>
                  <Field
                    name="bathrooms"
                    component="input"
                    type="number"
                  ></Field>
                </p>
                <button type="submit" disabled={submitting || pristine}>
                  Submit
                </button>
              </div>
            </form>
          )}
        />
        <div className="formContainer">
          <button
            type="submit"
            onClick={() => {
              setFilter(null);
              setSelected(null);
            }}
          >
            reset
          </button>
        </div>
        {selected && <RoomCard selected={selected}></RoomCard>}
      </div>
    </div>
  );
}

export default App;
