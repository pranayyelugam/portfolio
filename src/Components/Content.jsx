import React from 'react';
import img from '../Images/acadia_1.webp';
import CareerTree from './CareerTree';
import '../css/Content.scss';


const LeftContainer = () => {
    return (
        <header className="content-left">
            <div className="dp">
                <img src={img} alt="Pranay Yelugam" style={{ borderRadius: '5%' }} loading="lazy" width="288" height="288" />
            </div>
            <h1 className="stylish-name">Pranay Yelugam</h1>
            <h2 className="stylish-name job-title">Senior Software Engineer @ Verkada</h2>
        </header>
    );
};

const RightContainer = () => {
    return (
        <article className="content-right">
            <p>
                I work at the intersection of <b>scalable systems engineering</b> and <b>AI research</b>. Recently, I have been working on <b>AutoDiscovery</b>: building the infrastructure and models required to bring analytics from unstructured data.
                <br /><br />
                Currently, I am a Senior Software Engineer at <a href='https://www.verkada.com/'>Verkada</a>, where I architect high-performance distributed systems. 
                <br /><br />
                Previously, I conducted research at <a href="http://www.iesl.cs.umass.edu/">UMass Amherst IESL</a> with <a href="https://people.cs.umass.edu/~mccallum/">Prof. Andrew McCallum</a>. I worked on <b>probabilistic evaluation methods</b> for generative commonsense reasoning and analyzed <b>argumentation structures</b> in scientific peer reviews—developing methods to extract rigorous insights from open-ended, unstructured text.
            </p>
        </article>
    );
};

const Content = () => {
    return (
        <>
            <section className="content">
                <LeftContainer />
                <RightContainer />
            </section>
            <CareerTree />
        </>
    );
};

export default Content;