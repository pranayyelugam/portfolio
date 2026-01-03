import React from 'react';
import img from '../Images/acadia_1.webp';
import CareerTree from './CareerTree';
import '../css/Content.scss';


const LeftContainer = () => {
    return (
        <header className="content-left">
            <div className="dp">
                <img src={img} alt="Pranay Yelugam" style={{ borderRadius: '5%' }} loading="lazy" />
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
                I'm currently working as a Senior Software Engineer at <a href='https://www.verkada.com/'>Verkada</a>. I received my
                B.Tech from the Indian Institute of Information Technology Allahabad, and completed my M.S. at the College of Information & Computer Sciences at the University of Massachusetts Amherst,
                where I worked with <a href="https://people.cs.umass.edu/~mccallum/">Andrew McCallum</a> at <a href="http://www.iesl.cs.umass.edu/">IESL</a>.
                <br /><br />

                <b>Research Interests:</b> My research interests lie at the intersection of natural language processing, question answering (QA), commonsense reasoning, knowledge representation, and machine learning.
                I am particularly interested in combining external knowledge sources with Large Language Models (LLMs) for generative QA.

                <br /><br />
                <b>Experience:</b> Previously, I worked on designing a probabilistic evaluation method for open-ended commonsense question answering tasks.
                I also analyzed discourse structure in scientific peer reviews to understand its impact on transparency in the review process. 
                I helped annotate a dataset and create models to gain insights into the peer review system through the lens of document-level discourse.
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