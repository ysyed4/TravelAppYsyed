import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GuestPage.css";

export const GuestPage = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [searchParams, setSearchParams] = useState({
    name: "",
    region: "",
    country: "",
  });
  const [searchResults, setSearchResults] = useState([]);
  const [publicLists, setPublicLists] = useState([]);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prevParams) => ({
      ...prevParams,
      [name]: value,
    }));
  };

  const handleSearch = async () => {
    try {
      const query = new URLSearchParams(searchParams).toString();
      const response = await fetch(
        `http://localhost:3000/api/guest/destinations?${query}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch destinations");
      }
      const data = await response.json();
      setSearchResults(data);
      setErrorMessage("");
    } catch (error) {
      console.error("Error during search:", error);
      setErrorMessage("Error fetching search results");
    }
  };

  const handleCreateAccountClick = () => {
    navigate("/");
  };
  useEffect(() => {
    const fetchPublicLists = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/public-lists");
        if (!response.ok) {
          throw new Error("Failed to fetch public destination lists");
        }
        const data = await response.json();
        setPublicLists(data);
      } catch (error) {
        console.error("Error fetching public destination lists:", error);
      }
    };
    fetchPublicLists();
  }, []);

  return (
    <div className="guest-page-container">
      <h1>Welcome Guest!</h1>
      <p>
        Our site offers easy access to some of the top destination spots in all
        of Europe! With a guest account, you can only view our public lists.
        However, if you register, you'll have access to all of our European
        destinations and will even be able to create your own getaway lists for
        yourself or to share with others! Click the link to create an account
        with us:
      </p>
      <button className="signup-button" onClick={handleCreateAccountClick}>
        Create an Account
      </button>
      <div className="policy-links">
        <h2>Policies</h2>
        <ul>
          <li>
            <a
              href="/privacy-policy.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy and Security Policy
            </a>
          </li>
          <li>
            <a
              href="/dmca-policy.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              DMCA Notice & Takedown Policy
            </a>
          </li>
          <li>
            <a href="/aup.html" target="_blank" rel="noopener noreferrer">
              Acceptable Use Policy
            </a>
          </li>
        </ul>
      </div>

      <div className="search-container">
        <h2>Search Destinations</h2>
        <div className="search-inputs">
          <input
            type="text"
            name="name"
            placeholder="Destination Name"
            value={searchParams.name}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="region"
            placeholder="Region"
            value={searchParams.region}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="country"
            placeholder="Country"
            value={searchParams.country}
            onChange={handleInputChange}
          />
        </div>
        <button onClick={handleSearch}>Search</button>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <div className="search-results">
        <h2>Search Results</h2>
        {searchResults.length > 0 ? (
          searchResults.map((destination) => (
            <div key={destination._id} className="search-result-item">
              <h3>
                {destination.Destination || "Unknown Destination"},{" "}
                {destination.Country || "Unknown Country"}
              </h3>
              <button
                onClick={() =>
                  window.open(
                    `https://duckduckgo.com/?q=${encodeURIComponent(
                      `${destination.Destination}, ${destination.Country}`
                    )}`,
                    "_blank"
                  )
                }
              >
                Search on DDG
              </button>
              <button
                onClick={() => {
                  setSearchResults((prevResults) =>
                    prevResults.map((result) =>
                      result._id === destination._id
                        ? { ...result, expanded: !result.expanded }
                        : result
                    )
                  );
                }}
              >
                {destination.expanded ? "Hide Details" : "View Details"}
              </button>
              {destination.expanded && (
                <div className="destination-details">
                  <p>Region: {destination.Region || "Unknown Region"}</p>
                  <p>Category: {destination.Category || "Unknown Category"}</p>
                  <p>
                    Coordinates:
                    {destination.coordinates?.latitude !== undefined
                      ? `${destination.coordinates.latitude}, ${destination.coordinates.longitude}`
                      : "N/A"}
                  </p>
                  <p>Currency: {destination.Currency || "Unknown Currency"}</p>
                  <p>Language: {destination.Language || "Unknown Language"}</p>
                  <p>Safety: {destination.Safety || "Unknown Safety Info"}</p>
                  <p>
                    Description:{" "}
                    {destination.Description || "No Description Available"}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No results found</p>
        )}
      </div>

      <div className="public-lists">
        <h2>Public Destination Lists</h2>
        {publicLists.length > 0 ? (
          publicLists.map((list) => (
            <div key={list._id} className="public-list-item">
              <h3>{list.name}</h3>
              <p>Creator: {list.creatorNickname}</p>
              <p>Number of Destinations: {list.numDestinations}</p>
              <p>Average Rating: {list.averageRating}</p>
              <button
                onClick={() => {
                  setPublicLists((prevLists) =>
                    prevLists.map((prevList) =>
                      prevList._id === list._id
                        ? { ...prevList, expanded: !prevList.expanded }
                        : prevList
                    )
                  );
                }}
              >
                {list.expanded ? "Hide Details" : "View Details"}
              </button>
              {list.expanded && (
                <div className="list-details">
                  <p>
                    Description:{" "}
                    {list.description || "No Description Available"}
                  </p>
                  <div className="destinations-list">
                    <h4>Destinations:</h4>
                    {list.destinations && list.destinations.length > 0 ? (
                      list.destinations.map((destination) => (
                        <div key={destination._id} className="destination-item">
                          <p>
                            <strong>
                              {destination.Destination || "Unknown Destination"}
                            </strong>{" "}
                            - {destination.Region || "Unknown Region"},{" "}
                            {destination.Country || "Unknown Country"}
                          </p>
                          <button
                            onClick={() => {
                              setPublicLists((prevLists) =>
                                prevLists.map((prevList) =>
                                  prevList._id === list._id
                                    ? {
                                        ...prevList,
                                        destinations: prevList.destinations.map(
                                          (dest) =>
                                            dest._id === destination._id
                                              ? {
                                                  ...dest,
                                                  expanded: !dest.expanded,
                                                }
                                              : dest
                                        ),
                                      }
                                    : prevList
                                )
                              );
                            }}
                          >
                            {destination.expanded
                              ? "Hide More Info"
                              : "View More Info"}
                          </button>
                          {destination.expanded && (
                            <div className="destination-more-info">
                              <p>
                                Coordinates:{" "}
                                {destination.coordinates?.latitude || "N/A"},{" "}
                                {destination.coordinates?.longitude || "N/A"}
                              </p>
                              <p>
                                Currency:{" "}
                                {destination.Currency || "Unknown Currency"}
                              </p>
                              <p>
                                Language:{" "}
                                {destination.Language || "Unknown Language"}
                              </p>
                              <p>
                                Safety:{" "}
                                {destination.Safety || "Unknown Safety Info"}
                              </p>
                              <p>
                                Description:{" "}
                                {destination.Description ||
                                  "No Description Available"}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>No destinations found in this list</p>
                    )}
                  </div>
                  <div className="reviews-section">
                    <h4>Reviews:</h4>
                    {list.reviews && list.reviews.length > 0 ? (
                      list.reviews.map((review) => {
                        return (
                          <div key={review._id} className="review-item">
                            <p>
                              <strong>
                                {review.user?.nickname || "Anonymous"}
                              </strong>{" "}
                              - {new Date(review.createdAt).toLocaleString()}
                            </p>
                            <p>Rating: {review.rating}/5</p>
                            <p>{review.comment}</p>
                          </div>
                        );
                      })
                    ) : (
                      <p>No reviews yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No public destination lists found</p>
        )}
      </div>
    </div>
  );
};
