import React from 'react';
import img from '../Images/profile_new.webp';
import CareerTree from './CareerTree';
import '../css/Content.scss';


const LeftContainer = () => {
    return (
        <header className="content-left">
            <div className="dp">
                <img src={img} alt="Pranay Yelugam" style={{ borderRadius: '5%' }} fetchpriority="high" width="288" height="384" />
            </div>
            <h1 className="stylish-name">Pranay Yelugam</h1>
            <h2 className="stylish-name job-title">Software Engineer @ Verkada</h2>
        </header>
    );
};

const RightContainer = () => {
    return (
        <article className="content-right">
            <p>
                I&rsquo;m a software engineer at <a href="https://www.verkada.com/">Verkada</a>, where I build <b>data infrastructure</b>.
            </p>
            <p>
                Outside of work, I&rsquo;m researching <b>AutoDiscovery</b>: infrastructure and models for pulling insights out of unstructured data.
            </p>
            <p>
                During my master&rsquo;s at UMass Amherst, I did NLP research at <a href="http://www.iesl.cs.umass.edu/">IESL</a> with <a href="https://people.cs.umass.edu/~mccallum/">Prof. Andrew McCallum</a>, on <b>probabilistic evaluation</b> of commonsense reasoning (<a href="https://aclanthology.org/2024.acl-long.29/">ACL&nbsp;2024</a>) and the <b>discourse structure</b> of scientific peer review (<a href="https://arxiv.org/abs/2110.08520">NAACL&nbsp;2022</a>).
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