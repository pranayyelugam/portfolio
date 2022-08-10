import React, { Component } from 'react';
import '../css/Publications.scss'
export default class PublicationComponent extends Component {
    render() {
        const publications = [
            {
                'title': 'DISAPERE: A Dataset for Discourse Structure in Peer Review Discussions',
                'link': 'https://arxiv.org/abs/2110.08520',
                'authors': "Neha Nayak Kennard, Tim O'Gorman, Rajarshi Das, Akshay Sharma, Chhandak Bagchi, Matthew Clinton, Pranay Kumar Yelugam, Hamed Zamani, Andrew McCallum",
                'conference': '2022 Annual Conference of the North American Chapter of the Association for Computational Linguistics (NAACL 2022) Hybrid. July, 2022.'
            },
            {
                'title': 'Real Time Mining of Ego Networks for Exploring Social Associations',
                'link': 'https://ieeexplore.ieee.org/document/8340594',
                'authors': 'A Bharadwaju, Yelugam Pranay Kumar, K Anudeep, AV Krishna, BR Prasad, S Agarwal',
                'conference': '2017 3rd International Conference on Computational Intelligence & Communication Technology (CICT 2017) February, 2017'
            }
        ]
        return (
            <div class="publications">
                <ul>
                    {publications.map((publication, index) => {
                        return (
                            <li key={index}>
                                <a href={publication.link}> {publication.title}</a><br></br>
                                <p>{publication.authors}</p>
                                <p><i>{publication.conference}</i></p>
                                
                            </li>
                        )
                    })}
                </ul>

               

            </div>
        )
    }
}