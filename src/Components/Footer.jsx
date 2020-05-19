import React, { Component } from 'react';
import { SocialIcon } from 'react-social-icons';


export default class Footer extends Component {
    render() {
        return (
            <div className="content-bottom">
                <SocialIcon style={{ height: 40, width: 40, marginRight: '1rem' }} url="https://github.com/pranayyelugam" fgColor="#000000" bgColor="#C0C0C0" />
                <SocialIcon style={{ height: 40, width: 40, marginRight: '1rem' }} url="https://twitter.com/pranaykumar1096" fgColor="#000000" bgColor="#C0C0C0" />
                <SocialIcon style={{ height: 40, width: 40, marginRight: '1rem' }} url="mailto:ypranayraj@gmail.com" fgColor="#000000" bgColor="#C0C0C0" />
            </div>
        )
    }
}