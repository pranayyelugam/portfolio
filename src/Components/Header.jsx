import React, { useState } from 'react';
import classNames from 'classnames';
import {
    Link,
    useRouteMatch
} from "react-router-dom";
import ThemeToggle from './ThemeToggle';
import Images from './images';
import '../css/Header.scss';

const preloadImages = (images) => {
    images.forEach((image) => {
        const img = new Image();
        img.src = image.src;
    });
};

const Header = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="header-row">
            <div className="header-content">
                <div className="mobile-header-top">
                    {/* Hamburger Button for Mobile */}
                    <button 
                        className={`hamburger-menu ${isMobileMenuOpen ? 'open' : ''}`}
                        onClick={toggleMenu}
                        aria-label="Toggle navigation menu"
                        aria-expanded={isMobileMenuOpen}
                    >
                        <span className="bar"></span>
                        <span className="bar"></span>
                        <span className="bar"></span>
                    </button>
                    
                    {/* Theme Toggle sticks to top right on mobile */}
                    <div className="mobile-theme-toggle">
                        <ThemeToggle />
                    </div>
                </div>

                <ul className={`nav-bar ${isMobileMenuOpen ? 'mobile-visible' : ''}`}>
                    <li onClick={closeMenu}><CustomLink to="/" label="Home" /></li>
                    <li onClick={closeMenu}><CustomLink to="/publications" label="Publications" /></li>
                    <li onClick={closeMenu}><CustomLink to="/projects" label="Projects" /></li>
                    <li onClick={closeMenu}><CustomLink 
                        to="/photography" 
                        label="Photography" 
                        onMouseEnter={() => {
                            import('./Photography');
                            preloadImages(Images);
                        }} 
                    /></li>
                    <li onClick={closeMenu}><CustomLink to="/blog" label="Blog" /></li>
                </ul>
                
                {/* Desktop Theme Toggle position */}
                <div className="desktop-theme-toggle">
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
};

const CustomLink = ({ to, label, ...rest }) => {
    let match = useRouteMatch({
        path: to,
        exact: true
    });
    let menuItemClass = classNames('nav-mem');
    let menuActiveItemClass = classNames('active-menu-item');

    return (
        <Link className={match ? menuActiveItemClass : menuItemClass} to={to} {...rest}>{label}</Link>
    );
};

export default Header;