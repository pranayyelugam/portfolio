import React, { Component } from 'react';

import { AiOutlineFilePdf, AiFillGithub } from 'react-icons/ai';

import { GrMail } from 'react-icons/gr';
import { SiGooglescholar } from 'react-icons/si';




import '../css/Footer.scss'

export default class Footer extends Component {
    render() {
        return (
            <div className="content-bottom">
                <div style={{ marginRight: '1rem'  }}>
                    <a href="https://github.com/pranayyelugam" aria-label="GitHub Profile"><AiFillGithub size="25px" /></a>
                </div>

                <div style={{ marginRight: '1rem' }}>
                    <a href="mailto:ypranayraj@gmail.com" aria-label="Email Me"><GrMail size="25px" /></a>
                </div>

                <div style={{ marginRight: '1rem' }}>
                    <a href="https://scholar.google.com/citations?user=i4JN7mwAAAAJ&hl=en" aria-label="Google Scholar Profile"><SiGooglescholar size="25px" /></a>
                </div>
            </div>
        )
    }
}











