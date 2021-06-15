import React, { Component } from 'react'
import Card from 'card-vibes'
import img from '../Images/pxl.jpg'
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
                    <h4 className="stylish-name">Graduate Student @ CICS</h4>
                    <h4 className="stylish-name">University of Massachusetts Amherst</h4>
                </div>
                <div className="content-right">
                   
                 
                    <p style={{
                        lineHeight:"1.5rem"
                    }}>
                        I'm a first year Masters student in the College of Information & Computer Sciences at the University of Massachusetts Amherst.
                        Previously, I completed my Bachelors in Computer Science at Indian Institute of Information Technology Allahabad, advised by &nbsp;
                         <a href="http://www.sonaliagarwal.com/">
                            Dr. Sonali Agarwal.
                        </a>
                        .&nbsp;
                         <br></br> <br></br>
                        Most recently, I worked on analysing the discourse structure in scientific peer review and how this study impacts the transparency in the
                        scientific peer review system. I helped in annotating a dataset and creating models that would give more insights into peer review system through the lens
                        of discourse at the document level.

                        I was advised by <a href="https://people.cs.umass.edu/~mccallum/">Prof. Andrew McCallum</a> and &nbsp;
                        <a href="https://nnkennard.github.io/">Neha Kennard</a>  
                    
                        .&nbsp; 
                         <br></br> <br></br>
                        Currently, I'm working as a Research Intern at <a href="http://www.iesl.cs.umass.edu/">
                            IESL
                        </a> under the supervision of &nbsp;
                        <a href="https://people.cs.umass.edu/~mccallum/">Prof. Andrew McCallum</a> and &nbsp;
                        <a href="https://people.cs.umass.edu/~xiangl/">Xiang Lorraine Li</a> and &nbsp;
                        <a href="https://people.cs.umass.edu/~mboratko/">Michael Boratko</a> solving problems pertaining to commonsense reasoning.
                        
                    </p>
                   
                </div>
            </div>

        );
    }

}
