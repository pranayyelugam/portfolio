import React, { Component } from 'react';
import '../css/books.scss'
export default class BooksComponenet extends Component {
    render() {
        return (
            <div class="books-container">
                <h1 className="stylish-name">Some of the books I loved reading: </h1>
                <ui>
                    <li>To Kill a Mockingbird</li>
                    <li>Flowers for Algernon</li>
                    <li>The Book Thief</li>
                    <li>Permanent Record</li>
                    <li>The Godfather</li>
                    <li>The Last Juror</li>
                    <li>Ikigai: The Japanese Secret to a Long and Happy Life</li>
                </ui>

            </div>
        )
    }
}