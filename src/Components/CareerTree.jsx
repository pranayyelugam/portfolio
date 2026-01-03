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
        year: '2014-2018',
        title: 'Bachelor of Technology',
        organization: 'IIIT Allahabad',
        location: 'Allahabad, India',
        type: 'education',
        description: 'Laid the foundation for my journey into computer science and research.',
        country: 'india',
        monument: 'tajMahal'
    },
    {
        year: '2018-2020',
        title: 'Software Engineer II',
        organization: 'Samsung Research',
        location: 'Noida, India',
        type: 'work',
        description: 'Built data systems powering Samsung TVs worldwide, handling multi-terabyte data pipelines for streaming platforms.',
        country: 'india',
        monument: 'indiaGate'
    },
    {
        year: '2021-2022',
        title: 'Master of Science',
        organization: 'UMass Amherst',
        location: 'Amherst, MA',
        type: 'education',
        description: 'Researched discourse analysis in scientific peer review and probabilistic evaluation methods for commonsense QA at IESL.',
        country: 'usa',
        monument: 'lighthouse'
    },
    {
        year: '2022-2025',
        title: 'Senior Software Engineer',
        organization: 'Eightfold AI',
        location: 'Santa Clara, CA',
        type: 'work',
        description: 'Led infrastructure initiatives that improved system performance and reliability at scale.',
        country: 'usa',
        monument: 'goldenGate'
    },
    {
        year: 'Apr 2025-Present',
        title: 'Senior Software Engineer',
        organization: 'Verkada',
        location: 'San Mateo, CA',
        type: 'work',
        description: 'Building the next generation of data infrastructure.',
        country: 'usa',
        monument: 'goldenGate'
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

const CareerNode = ({ item, isLast, showCountry, isReverse }) => {
    return (
        <article className={`career-node ${item.type} ${isReverse ? 'reverse' : ''}`} aria-label={`${item.title} at ${item.organization}`}>
            <div className="node-left">
                {item.monument && (
                    <div className="monument-container">
                        <img 
                            src={monumentImages[item.monument]} 
                            alt={`${item.location} monument`}
                            className="monument-icon"
                            width="100"
                            height="80"
                        />
                    </div>
                )}
            </div>
            
            <div className={`node-center ${showCountry ? 'has-country' : ''}`}>
                {showCountry && (
                    <img 
                        src={countryImages[item.country]} 
                        alt={item.country} 
                        className="country-icon"
                        width="50"
                        height="50"
                    />
                )}
                <div className="node-connector">
                    <div className="node-dot" />
                </div>
            </div>

            <div className="node-right">
                <div className="node-content">
                    {item.monument && (
                        <div className="mobile-monument-container">
                            <img 
                                src={monumentImages[item.monument]} 
                                alt={`${item.location} monument`}
                                className="monument-icon-mobile"
                                width="60"
                                height="48"
                            />
                        </div>
                    )}
                    <header className="node-header">
                        <span className="node-year">{item.year}</span>
                        <span className="node-location">{item.location}</span>
                    </header>
                    <h3 className="node-title">{item.title}</h3>
                    <h4 className="node-org">{item.organization}</h4>
                    <p className="node-description">{item.description}</p>
                </div>
            </div>
        </article>
    );
};

const CareerTree = () => {
    return (
        <section className="career-tree" aria-label="Professional Experience">
            <h2 className="career-title">Experience & Education</h2>
            <div className="career-timeline">
                {careerData.map((item, index) => {
                    // Show country if it's the first item OR if the country is different from the previous item
                    const showCountry = index === 0 || careerData[index - 1].country !== item.country;
                    
                    return (
                        <CareerNode 
                            key={index} 
                            item={item} 
                            isLast={index === careerData.length - 1}
                            showCountry={showCountry}
                            isReverse={index % 2 !== 0}
                        />
                    );
                })}
            </div>
        </section>
    );
};

export default CareerTree;
