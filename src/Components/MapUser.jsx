import React, { memo, useState } from 'react'
import { withRouter } from "react-router";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker
} from "react-simple-maps";
import { UncontrolledReactSVGPanZoom } from 'react-svg-pan-zoom'
import ReactTooltip from "react-tooltip";
import '../css/MapUser.scss'


const styles = {
    fontFamily: "sans-serif",
    textAlign: "center"
};

const INDIA_TOPO_JSON = require('../topo.json');

class MapUser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: []
        };
    }
    componentDidMount() {
        const id = this.props.match.params.id;
        this.fetchData(id)
    }

    fetchData = (id) => {
        let url = 'https://indiacities.herokuapp.com/user?userId=' + id
        return fetch(url).then(function (response) {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response;
        })
            .then(response => response.json())
            .then(res => {
                let arrOfObj = Object.entries(res[0]).map(e => e[1])
                this.setState({
                    data: arrOfObj.slice(1)
                })
            }).catch(error => {
                console.log(error)

            });
    }
    render() {
        return <div>{this.state.data.length > 0 ? <MapUserDataComponent data={this.state.data} /> : <div></div>}</div>;
    }
}

function MapUserDataComponent(data) {
    const [content, setContent] = useState("");

    return (
        <div>
            <Map setTooltipContent={setContent} data={data} />
            <ReactTooltip>{content}</ReactTooltip>
        </div>
    )
}

class Map extends React.Component {
    constructor(props) {
        super(props);
    }

    Viewer = null

    componentDidMount() {
        this.Viewer.fitToViewer();
    }


    displayTooltip(city, state, pop) {
        let ret = capitalizeFirstLetter(city) + "," + state + "(" + pop + ")"
        return ret
    }

    calculateCirlceRadius(population) {
        let cirlceRadius = 1;
        if (population > 9478447) {
            cirlceRadius = 14;
        }
        else if (population > 5486973) {
            cirlceRadius = 10;
        }
        else if (population > 1240000) {
            cirlceRadius = 7;
        }
        else {
            cirlceRadius = 5;
        }
        return cirlceRadius
    }

    render() {
        let cities = this.props.data.data
        return (
            <div className="user-box">
                <UncontrolledReactSVGPanZoom
                    width={800}
                    height={550}
                    ref={(Viewer) => (this.Viewer = Viewer)}
                    customMiniature={customMiniature}
                    detectAutoPan={false}
                    scaleFactorMax={5}
                    scaleFactorMin={1}
                    //tool="pan"
                    background="#6c757d10"
                >
                    <div width={800}
                        height={550}>
                        <ComposableMap
                            data-tip=""
                            projection="geoMercator"
                            projectionConfig={{
                                scale: 900,
                                center: [78.9629, 22.5937]
                            }}
                            width={800}
                            height={550}
                        >
                            <Geographies geography={INDIA_TOPO_JSON}>
                                {({ geographies }) =>
                                    geographies
                                        .map(geo => (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill="#D5DED9"
                                                stroke="#ffffff"
                                                style={{
                                                    default: { outline: "none" },
                                                    hover: { outline: "none" },
                                                    pressed: { outline: "none" },
                                                }}
                                            />
                                        ))
                                }
                            </Geographies>

                            {cities.map(({ city, lat, long, code, population, i }) => (
                                <Marker
                                    key={capitalizeFirstLetter(city)}
                                    coordinates={[long, lat]}
                                    onMouseEnter={() => {

                                        this.props.setTooltipContent(`${capitalizeFirstLetter(city)}, ${code} (${numberWithCommas(population)})`);
                                    }}
                                    onMouseLeave={() => {
                                        this.props.setTooltipContent("");
                                    }}
                                >
                                    <circle r={this.calculateCirlceRadius(population)} fill="#D95B43" stroke="#fff" strokeWidth={0.5} />
                                </Marker>

                            ))}
                        </ComposableMap>
                    </div>
                </UncontrolledReactSVGPanZoom>
                {cities.length > 0 ? <CitiesInfoPortion citiesData={cities} /> : <div></div>}
            </div>
        )
    }
}
const customMiniature = () => {
    return (
        <div></div>
    )
}

const customToolbar = () => {
    return (
        <div></div>
    )
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function capitalizeFirstLetter(string) {
    if (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}


const CitiesInfoPortion = (props) => {
    const { citiesData, ...other } = props
    const isNotEmpty = citiesData.length > 0 ? true : false
    let popArray = isNotEmpty ? citiesData.map(c => parseInt(c.population)) : []
    let accPopulation = isNotEmpty ? popArray.reduce(function (a, b) {
        return a + b;
    }, 0) : 0
    return (
        <div style={{
            marginBottom: "2rem"
        }}>
            <p style={{
                fontSize: "24px",
                fontWeight: 5
            }}>You named {citiesData.length} cities with a total population of {numberWithCommas(accPopulation)}  in 2011. </p>
            <h2>Cities:</h2>
            <p style={{
                fontSize: "20px",
                fontWeight: 5
            }}>{isNotEmpty ? citiesData.map(c =>
                <div>
                    {capitalizeFirstLetter(c.city)}, {c.code} ({numberWithCommas(c.population)})
                    < br />
                </div>
            ) : <div></div>}</p>
        </div>
    )
}


export default withRouter(MapUser);
