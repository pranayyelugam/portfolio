import React, { Component, useState, useEffect } from 'react'
import Slider from 'react-slick';
import Images from './images';

import '../css/Photography.scss'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'


const CarouselContainer = () => {   
    const settings = {
        dots: true,
        infinite: false,
        speed: 1000,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
    };
    return (
        <div className='image-container'>
            <Slider {...settings}>
                {Images.map((item) => (
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