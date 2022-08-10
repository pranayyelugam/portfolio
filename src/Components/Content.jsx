import React, { Component } from 'react'
import Card from 'card-vibes'
import img from '../Images/acadia_1.jpg'
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
                            <img src={img} style={{ borderRadius: '5%' }}></img>
                        </div>
                   
                   
                    <h1 className="stylish-name">Pranay Yelugam</h1>
                    <h4 className="stylish-name">MTS @ Eightfold.ai</h4>
                    <h4 className="stylish-name">Graduate Student @ CICS</h4>
                    <h4 className="stylish-name">University of Massachusetts Amherst</h4>
                </div>
                <div className="content-right">
                   
                 
                    <p style={{
                        lineHeight:"1.5rem"
                    }}>
                        I'm currently working as a Member of Technical Staff (MTS) at <a href='https://eightfold.ai'>Eightfold.ai</a>. I received my
                        B.S. from Indian Institute of Information Technology Allahabad, and completed M.S. from the College of Information & Computer Sciences at the University of Massachusetts Amherst,
                        during which I spent some time at <a href="http://www.iesl.cs.umass.edu/">IESL</a> working with <a href="https://people.cs.umass.edu/~mccallum/">Andrew McCallum.</a>
                        <br></br> <br></br>
                        
                        <b>Research Interests:</b> I'm more inclined towards research at the intersection of natural language processing, question answering, commonsense question answering, knowledge representation, and machine learning in general. 
                        My current research interests include combining external knowledge sources with Langugage Models for generative question answering. 
                        
                        <br></br> <br></br>
                        <b>Experience:</b> Most recently, I worked on designing a probabilistic evaluation method for open-ended commonsense question answering tasks.
                        Previously, I worked on analysing the discourse structure in scientific peer review and how this study impacts the transparency in the
                        scientific peer review system. I helped in annotating a dataset and creating models that would give more insights into peer review system through the lens
                        of discourse at the document level. 
                        
                    </p>
                   
                </div>
            </div>

        );
    }

}
