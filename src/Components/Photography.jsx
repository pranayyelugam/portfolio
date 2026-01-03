import React, { Component, useState, useEffect } from 'react'
import Slider from 'react-slick';
import Images from './images';

import '../css/Photography.scss'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'


const CarouselContainer = () => {   
    const settings = {
        dots: true,
        infinite: true,
        speed: 1000,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        responsive: [
            {
                breakpoint: 768,
                settings: "unslick"
            }
        ]
    };

    const [selectedTag, setSelectedTag] = useState(null);

    const toggleTag = (tag) => {
        if (selectedTag === tag) {
            setSelectedTag(null);
        } else {
            setSelectedTag(tag);
        }
    };

    const visibleImages = selectedTag
        ? Images.filter(img => img.tags && img.tags.includes(selectedTag))
        : Images;

    return (
        <div className='image-container'>
            <Slider {...settings} key={selectedTag}> {/* Key forces remount on filter change */}
                {visibleImages.map((item) => (
                    <div key={item.id} className="slide-item">
                        <img 
                            src={item.src} 
                            alt={item.alt} 
                            className="img-style"
                            width="1000"
                            height="667"

                        />
                        <h2 className="title">{item.title}</h2>
                        <p className="description">{item.description}</p>
                        {item.tags && (
                            <div className="tag-container" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                                {item.tags.map((tag, i) => (
                                    <span 
                                        key={i} 
                                        className={`tag-pill ${selectedTag === tag ? 'active' : ''}`}
                                        onClick={() => toggleTag(tag)}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </Slider>
        </div>
    
    )
}


const PhotographyContainer = () => {
    return (
        <CarouselContainer />
    );
}

export default PhotographyContainer;