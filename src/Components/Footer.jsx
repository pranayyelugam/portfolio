import React, { Component } from 'react';
import { SocialIcon } from 'react-social-icons';
import { AiOutlineFilePdf, AiFillGithub } from 'react-icons/ai';
import { FiTwitter } from 'react-icons/fi';
import { GrMail } from 'react-icons/gr';
import { SiGooglescholar } from 'react-icons/si';

import resume from '../resume_22.pdf'


import '../css/Footer.scss'

export default class Footer extends Component {
    render() {
        return (
            <div className="content-bottom">
                <div style={{ marginRight: '1rem'  }}>
                    <a href="https://github.com/pranayyelugam"><AiFillGithub size="25px" /></a>
                </div>
                <div style={{ marginRight: '1rem' }}>
                    <a href="https://twitter.com/pranaykumar1096"><FiTwitter size="25px" /></a>
                </div>
                <div style={{ marginRight: '1rem' }}>
                    <a href="mailto:ypranayraj@gmail.com"><GrMail size="25px" /></a>
                </div>
                <div style={{ marginRight: '1rem' }}>
                    <a href={resume}><AiOutlineFilePdf size="25px" /></a>
                </div>
                <div style={{ marginRight: '1rem' }}>
                    <a href="https://scholar.google.com/citations?user=i4JN7mwAAAAJ&hl=en"><SiGooglescholar size="25px" /></a>
                </div>
            </div>
        )
    }
}











