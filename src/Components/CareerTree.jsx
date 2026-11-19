import React from 'react';
import './CareerTree.scss';
import indiaImg from '../Images/india.webp';
import usaImg from '../Images/usa.webp';
import tajMahalImg from '../Images/taj_mahal.webp';
import indiaGateImg from '../Images/india_gate.webp';
import lighthouseImg from '../Images/lighthouse.webp';
import goldenGateImg from '../Images/golden_gate.webp';

const careerData = [
    {
        year: 'Apr 2025 – Present',
        title: 'Software Engineer',
        organization: 'Verkada',
        location: 'San Mateo, CA',
        type: 'work',
        description: 'Building the next generation of data infrastructure.',
        country: 'usa',
        monument: 'goldenGate'
    },
    {
        year: '2022 – 2025',
        title: 'Software Engineer',
        organization: 'Eightfold AI',
        location: 'Santa Clara, CA',
        type: 'work',
        description: 'Led infrastructure work to make the platform faster and more reliable at scale.',
        country: 'usa',
        monument: 'goldenGate'
    },
    {
        year: '2021 – 2022',
        title: 'Master of Science',
        organization: 'UMass Amherst',
        location: 'Amherst, MA',
        type: 'education',
        description: 'Research at IESL on the discourse structure of peer review (NAACL 2022) and probabilistic evaluation of commonsense QA (ACL 2024).',
        country: 'usa',
        monument: 'lighthouse'
    },
    {
        year: '2018 – 2020',
        title: 'Software Engineer',
        organization: 'Samsung Research',
        location: 'Noida, India',
        type: 'work',
        description: 'Built multi-terabyte data pipelines behind the streaming services on Samsung TVs worldwide.',
        country: 'india',
        monument: 'indiaGate'
    },
    {
        year: '2014 – 2018',
        title: 'Bachelor of Technology',
        organization: 'IIIT Allahabad',
        location: 'Allahabad, India',
        type: 'education',
        description: 'Where I started doing research: my first paper, on real-time mining of ego networks, appeared at CICT 2017.',
        country: 'india',
        monument: 'tajMahal'
    }
];

const countryImages = {
    india: indiaImg,
    usa: usaImg
};

const monumentImages = {
    tajMahal: tajMahalImg,
    indiaGate: indiaGateImg,
    lighthouse: lighthouseImg,
    goldenGate: goldenGateImg
};

const CareerNode = ({ item, showCountry, showMonument }) => (
    <li className={`career-node ${item.type}`}>
        <div className={`node-rail ${showCountry ? 'has-country' : ''}`} aria-hidden="true">
            {showCountry && (
                <img src={countryImages[item.country]} alt="" className="country-icon" width="36" height="36" />
            )}
        </div>
        <article className="node-content" aria-label={`${item.title}, ${item.organization}`}>
            {showMonument && (
                <img src={monumentImages[item.monument]} alt="" className="monument-icon" width="64" height="64" />
            )}
            <header className="node-header">
                <span className="node-year">{item.year}</span>
                <span className="node-location">{item.location}</span>
            </header>
            <h3 className="node-title">{item.title}</h3>
            <p className="node-org">{item.organization}</p>
            <p className="node-description">{item.description}</p>
        </article>
    </li>
);

const CareerTree = () => (
    <section className="career-tree" aria-labelledby="career-title">
        <h2 className="career-title" id="career-title">Experience &amp; Education</h2>
        <ol className="career-timeline">
            {careerData.map((item, index) => {
                const prev = careerData[index - 1];
                return (
                    <CareerNode
                        key={item.organization}
                        item={item}
                        // Country flag marks a move; a landmark shows once per place
                        showCountry={!prev || prev.country !== item.country}
                        showMonument={item.monument && (!prev || prev.monument !== item.monument)}
                    />
                );
            })}
        </ol>
    </section>
);

export default CareerTree;
