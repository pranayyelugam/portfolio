import React, { Component } from 'react';
import '../css/Publications.scss'
export default class PublicationComponent extends Component {
    render() {
        return (
            <div class="publications">
                <p>Real time mining of ego networks for exploring social associations</p>
                <p>A Bharadwaju, <b class="contribution-weight">Yelugam Pranay Kumar</b>, K Anudeep, AV Krishna, BR Prasad, S Agarwal</p>
                <p>2017 <i>Conference on Information and Communication Technology (CICT)</i>, 1-6</p>
                <a href="https://ieeexplore.ieee.org/document/8340594" style={{textDecoration:"None"}}> [Paper]</a>

            </div>
        )
    }
}