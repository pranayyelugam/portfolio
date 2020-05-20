import React, { Component } from 'react'
import Card from 'card-vibes'
import img from '../Images/profile_dp1.jpg'
import '../css/Content.scss'

export default class Content extends Component {
    constructor(props) {
        super(props);
        this.state = { isMobile: false, isSmallMobile: false };
    }

    componentDidMount() {
        this.setState({ isMobile: window.innerWidth < 480, isSmallMobile: window.innerWidth < 321 });
    }
    render() {
        const { isMobile, isSmallMobile } = this.state;
        return (
            <div className="content">
                <div className="content-left">
                    <div className="dp">
                        <img src={img} style={{ borderRadius: '50%' }}></img>
                    </div>
                    <Card style={{
                        width: isMobile ? '280px' : '300px',
                        padding: isMobile ? '10px' : '30px',
                        margin: isMobile ? '4px' : '10px'
                    }}>
                        <h1 className="stylish-name">Pranay Yelugam</h1>
                        <h4 className="stylish-name">SDE @ Samsung, Delhi</h4>
                        <h4 className="stylish-name">IIIT Allahabad</h4>
                    </Card>
                </div>
                <div className="content-right">
                    <Card style={{
                        width: isMobile ? '280px' : '300px',
                        padding: isMobile ? '10px' : '30px',
                        margin: isMobile ? '4px' : '10px',
                        borderRadius: '4px',
                        color: 'rgb(54, 73, 98)',
                        lineHeight: 1.6
                    }}
                    >
                        <p>My passion for technology is split between web technolgies and building machine learning models.
                        I like to participate in Kaggle challenges. I'm actively participating in kaggle challenges and you could find me there tinkering with the models. My current research includes finding solutions for the robustness
                        in the few shot classification. My past research focussed on exploring links between people in
                        social networks and extracting recommendations for the end user.
                            </p>
                    </Card>
                </div>
            </div>

        );
    }

}
