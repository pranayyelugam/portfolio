import React from 'react';
import { AiFillGithub, AiFillLinkedin } from 'react-icons/ai';
import { SiGooglescholar } from 'react-icons/si';
import '../css/Footer.scss';

const LINKS = [
    { href: 'https://github.com/pranayyelugam', label: 'GitHub Profile', Icon: AiFillGithub },
    { href: 'https://www.linkedin.com/in/pranay-yelugam-b27838121/', label: 'LinkedIn Profile', Icon: AiFillLinkedin },
    { href: 'https://scholar.google.com/citations?user=i4JN7mwAAAAJ&hl=en', label: 'Google Scholar Profile', Icon: SiGooglescholar },
];

const Footer = () => (
    <div className="content-bottom">
        {LINKS.map(({ href, label, Icon }) => (
            <div key={href}>
                <a href={href} aria-label={label}><Icon size="25px" /></a>
            </div>
        ))}
    </div>
);

export default Footer;
