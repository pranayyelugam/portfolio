import React from 'react';
import '../css/Photography.scss';
import Images from './images';

const Photography = () => {
    return (
        <div className="photography-page">
            <div className="gallery-grid">
                {Images.map((item) => (
                    <div key={item.id} className="gallery-item">
                        <img
                            src={item.src}
                            alt={item.alt}
                            className="gallery-img"
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Photography;