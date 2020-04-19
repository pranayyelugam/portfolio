import React, { Component } from 'react'
import Card from 'card-vibes'
import img from './Images/profile_dp1.jpg'


export default class Content extends Component {
    render() {
        return (
            <div className="content">
                <div className="content-left">
                    <div className="dp">
                        <img src={img} style={{ borderRadius: '50%' }}></img>
                    </div>
                    <Card>
                        <h1 className="stylish-name">Pranay Yelugam</h1>
                        <h4 className="stylish-name">SDE @ Samsung, Delhi</h4>
                        <h4 className="stylish-name">IIIT Allahabad</h4>
                    </Card>
                </div>
                <div className="content-right">
                    <Card style={{
                        width: '25rem',
                        padding: '2rem',
                        textAlign: 'left',
                        color: 'rgb(54, 73, 98)',
                        background: 'white',
                        lineHeight: '1.6rem'
                    }}>
                        My passion for technology is split between web technolgies and building machine learning models.
                        I like to participate in Kaggle challenges. I'm actively participating in kaggle challenges and I would
                        like to become a grandmaster in the future. My current research includes finding solutions for the robustness
                        in the few shot classification. My past research focussed on exploring links between people in
                        social networks and extracting recommendations for the end user. I am a react developer and have used
                        it to build a website for RoadPiper Technolgies.
                    </Card>
                </div>
            </div>

        );
    }

}
