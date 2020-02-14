import React from "react";
import ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Nav from "react-bootstrap/Nav";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";

import SearchBox from "./SearchBox.js";
import { SearchHit, SearchResults } from "./SearchResults.js";
import { Facet, FacetView } from "./Facet.js";

/** The main app */
class App extends React.Component {
  /**
   * constructor
   * @param {Object} this.state.results a set of search results.  The updateResults callback manipulates this.
   */
  constructor(props) {
    super(props);
    this.state = {
      query: "",
      facets: new Map(),
      results: "",
      qrels: new Map()
    };

    this.update_query = this.update_query.bind(this);
    this.update_filters = this.update_filters.bind(this);
    this.mark_relevant = this.mark_relevant.bind(this);
  }

  mark_relevant(docid, checked) {
    var qrels = this.state.qrels;
    if (checked) {
      qrels.set(docid, checked);
    } else {
      qrels.delete(docid);
    }
    this.setState({ qrels: qrels });
  }

  /**
   * update_query
   * When the user presses <return> in the search box, this callback updates
   * the App state to hold the textual portion of the query, and triggers a search update.
   */
  update_query(query_box_contents) {
    this.setState({ query: query_box_contents }, /* then, do */ this.do_search);
  }

  /**
   * update_filters
   * When the user checks or unchecks the radio buttons, this callback updates
   * the App state, and triggers a search update.
   */
  update_filters(facetkey, checked) {
    var facetmap = this.state.facets;
    if (checked) {
      facetmap.set(facetkey, checked);
    } else {
      facetmap.delete(facetkey);
    }
    this.setState({ facets: facetmap }, /* then, do */ this.do_search);
  }

  /**
   * build_query
   * Take the textual query and the facet filters and assemble the query to send
   * to the back-end.  Note that this is just a simple URL form... the back-end
   * builds this into the query for ElasticSearch.
   */
  build_query() {
    var query_string = "q=" + this.state.query;
    const facet_string = Array.from(this.state.facets.keys()).join(",");
    if (facet_string.length > 0) {
      query_string += "&facets=" + facet_string;
    }
    query_string = encodeURI(query_string);
    return query_string;
  }

  /**
   * do_search: send the search query to the backend, catch the result, and update state.
   */
  do_search() {
    const url = window.location.href + "search?" + this.build_query();
    // The query needs to be escaped before fetching.
    // const escaped = encodeURI(url);

    fetch(url)
      .then(response => {
        return response.json(); // ElasticSearch returns JSON data
      })
      .then(data => {
        this.setState({ results: data }); // Update the search results
      })
      .catch(err => {
        // do something on an error here.
      });
  }

  render() {
    const results = this.state.results;
    const aggs = results ? results.aggregations : "";

    return (
      <Container fluid="true">
        <Row className="justify-content-md-center mt-5">
          <Col sm="8">
            <SearchBox onSearch={this.update_query} />
          </Col>
        </Row>
        <Row>
          <Col sm="2">
            <FacetView
              aggs={aggs}
              checked={this.state.facets}
              onCheck={this.update_filters}
            />
          </Col>
          <Col sm="10">
            <SearchResults
              results={results}
              qrels={this.state.qrels}
              onRelevant={this.mark_relevant}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
