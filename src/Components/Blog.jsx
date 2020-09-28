import React, { memo, useState } from 'react'
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker
} from "react-simple-maps";
import '../css/Blogs.scss'
import { UncontrolledReactSVGPanZoom } from 'react-svg-pan-zoom'
import ReactTooltip from "react-tooltip";
import { useHistory } from "react-router-dom";


const INDIA_TOPO_JSON = require('../topo.json');


function BlogComponent() {
    const [content, setContent] = useState("");

    return (
        <div>
            <MapComponent setTooltipContent={setContent} />
            <ReactTooltip>{content}</ReactTooltip>
        </div>
    )
}

function SaveButton(props) {
    const history = useHistory();

    const datasave = (event) => {
        event.preventDefault();
        let cityURL = 'https://indiacities.herokuapp.com/cities'
        const arrayToObject = (array, keyField) =>
            array.reduce((obj, item) => {
                obj[item[keyField]] = item
                return obj
            }, {})
        const cityObject = arrayToObject(props.cityList, "_id")
        fetch(cityURL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cityObject)
        }).then(res => res.json())
            .then(data => {
                console.log(data)
                // this.props.onSelectLanguage(data.insertedIds[0]);
                history.push("/portfolio/maps/" + data.insertedIds[0]);
                localStorage.setItem("userData", JSON.stringify(data));
            });

    }
    return (
        <button onClick={datasave} type="button" className="boxleft1">Finish & Share</button>
    )
}

class MapComponent extends React.Component {
    constructor(props) {
        super(props);
        this.textInput = React.createRef();
        this.state = {
            city: '',
            data: [],
            userId: ''
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.displayTooltip = this.displayTooltip.bind(this);
        this.saveButton = this.saveButton.bind(this);
        this.clearState = this.clearState.bind(this)
    }

    Viewer = null

    componentDidMount() {
        this.Viewer.fitToViewer();
        this.hydrateStateWithLocalStorage()
    }

    handleChange(event) {
        this.setState({
            city: event.target.value
        })
    }

    clearState(event) {
        this.setState({
            city: '',
            data: []
        })
        localStorage.clear()
    }

    displayTooltip(city, state, pop) {
        let ret = this.capitalizeFirstLetter(city) + "," + state + "(" + pop + ")"
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

    capitalizeFirstLetter(string) {
        if (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

    }

    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    getCity(city, state) {
        let cityURL = 'https://indiacities.herokuapp.com/search?city='
        if (state === undefined) {
            cityURL += city
        } else {
            cityURL += city + '&state=' + state
        }
        return fetch(cityURL).then(function (response) {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response;
        })
            .then(response => response.json())
            .then(res => {
                console.log(res)
                const list = [...this.state.data]
                list.push(res[0])
                this.setState({
                    data: [...this.state.data, res[0]],
                    city: ''
                })
                localStorage.setItem("data", JSON.stringify(list))
            }).catch(error => {
                console.log(error)
                this.setState({
                    city: ''
                })
                this.textInput.current.classList.add('error')
                setTimeout(() => {
                    this.textInput.current.classList.remove('error')
                }, 300);
            });
    }

    hydrateStateWithLocalStorage() {
        // for all items in state
        for (let key in this.state) {
            // if the key exists in localStorage
            if (localStorage.hasOwnProperty(key)) {
                // get the key's value from localStorage
                let value = localStorage.getItem(key);

                // parse the localStorage string and setState
                try {
                    value = JSON.parse(value);
                    this.setState({ [key]: value });
                } catch (e) {
                    // handle empty string
                    this.setState({ [key]: value });
                }
            }
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        let inputString = this.state.city
        inputString = inputString.trim()
        let cityItem = inputString.split(',')
        let city = cityItem[0].trim()
        let state = undefined
        let checkIfCityAlreadyExists = await this.state.data.find(c => c.city === city)
        if (checkIfCityAlreadyExists) {
            this.setState({
                city: ''
            })
            this.textInput.current.classList.add('error')
            setTimeout(() => {
                this.textInput.current.classList.remove('error')
            }, 300);
            return
        }
        if (cityItem.length === 2) {
            state = cityItem[1].trim()
        }

        let c = await this.getCity(city, state)

        console.log(c)
    }



    saveButton(event) {
        event.preventDefault();
        let cityURL = 'https://indiacities.herokuapp.com/cities'
        const arrayToObject = (array, keyField) =>
            array.reduce((obj, item) => {
                obj[item[keyField]] = item
                return obj
            }, {})
        const cityObject = arrayToObject(this.state.data, "_id")
        fetch(cityURL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cityObject)
        }).then(res => res.json())
            .then(data => {
                this.setState({ userId: data.insertedIds[0] });

                this.props.history.push(data.insertedIds[0] + "/maps");
                localStorage.setItem("data", JSON.stringify(data));
                console.log(JSON.stringify(data));
            });
    }

    render() {
        return (
            <div className="box">
                <div className="box-left">
                    <p style={{
                        fontSize: "32px",
                        fontWeight: 8
                    }}>How many Indian cities can you name?</p>
                    <form onSubmit={this.handleSubmit}>
                        <label>
                            <input type="text" style={{
                                width: "100%",
                                padding: "12px 20px",
                                margin: "8px 0",
                                display: "inline - block",
                                border: "1px solid #ccc",
                                borderRadius: "4px",
                                boxSizing: "border-box"
                            }} value={this.state.city}
                                ref={this.textInput}
                                placeholder="'Chennai' or type 'Chennai, TN'"
                                onChange={this.handleChange} />
                        </label>
                    </form>

                    <div className="buttons">
                        <SaveButton cityList={this.state.data} />
                        <button onClick={this.clearState} className="boxleft2">Clear</button>
                    </div>


                </div>

                <div className="box-right">
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
                                    scale: 950,
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

                                {this.state.data.map(({ city, lat, long, code, population, i }) => (
                                    <Marker
                                        key={this.capitalizeFirstLetter(city)}
                                        coordinates={[long, lat]}
                                        onMouseEnter={() => {

                                            this.props.setTooltipContent(`${this.capitalizeFirstLetter(city)}, ${code} (${this.numberWithCommas(population)})`);
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
                </div>

            </div >

        )
    }
}



const customMiniature = () => {
    return (
        <div></div>
    )
}





export default (BlogComponent)
