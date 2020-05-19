import React, { Component } from 'react';
import classNames from 'classnames'
import {
    Link,
    useRouteMatch
} from "react-router-dom";

export default class Header extends Component {

    render() {
        return (
            <div>
                <div className="header-select">
                    <ul className="nav-bar">
                        <CustomLink to="/" label="Home" />
                        <CustomLink to="/blog" label="Blog" />
                        <CustomLink to="/books" label="Books" />
                        <CustomLink to="/cv" label="CV" />
                        <CustomLink to="/interests" label="Interests" />
                    </ul>
                </div>
            </div>

        )
    }
}

function CustomLink({ to, label }) {
    let match = useRouteMatch({
        path: to,
        exact: true
    })

    let menuItemClass = classNames('nav-mem')
    let menuActiveItemClass = classNames('active-menu-item')

    return (
        <Link className={match ? menuActiveItemClass : menuItemClass} to={to}>{label}</Link>
    )
}