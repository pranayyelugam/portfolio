import React, { Component, useState, useEffect } from 'react'
import Slider from 'react-slick';
import img from '../Images/acadia_1.jpg'
import Images from './images';

import '../css/Content.scss'
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
        autoplaySpeed: 1000,
    };
    return (
        <div style={{
            margin: "100px",
            height: "600px",
            width: "600px",
            flexDirection: "horizontal",
            alignContent: "center",
            justifyContent: "center",
            
        }}
        className='image-container'>
            <Slider {...settings}>
                {Images.map((item) => (
                    <div key={item.id}>
                        <img src={item.src} alt={item.alt} className="img-style"/>
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