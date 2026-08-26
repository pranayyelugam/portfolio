import React, { Component } from 'react';

import { AiOutlineFilePdf, AiFillGithub, AiFillLinkedin } from 'react-icons/ai';

import { SiGooglescholar } from 'react-icons/si';




import '../css/Footer.scss'

export default class Footer extends Component {
    render() {
        return (
            <div className="content-bottom">
                <div>
                    <a href="https://github.com/pranayyelugam" aria-label="GitHub Profile"><AiFillGithub size="25px" /></a>
                </div>

                <div>
                    <a href="https://www.linkedin.com/in/pranay-yelugam-b27838121/" aria-label="LinkedIn Profile"><AiFillLinkedin size="25px" /></a>
                </div>

                <div>
                    <a href="https://scholar.google.com/citations?user=i4JN7mwAAAAJ&hl=en" aria-label="Google Scholar Profile"><SiGooglescholar size="25px" /></a>
                </div>
            </div>
        )
    }
}











