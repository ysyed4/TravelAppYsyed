import React, { useState, useEffect } from "react";
import "./HomePage.css";

export const HomePage = () => {
  const [searchParams, setSearchParams] = useState({
    name: "",
    region: "",
    country: "",
  });
  const [searchResults, setSearchResults] = useState([]);
  const [publicLists, setPublicLists] = useState([]);
  const [userLists, setUserLists] = useState([]);
  const [privateLists, setPrivateLists] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [newList, setNewList] = useState({
    name: "",
    description: "",
    visibility: "private",
  });
  const [review, setReview] = useState({ rating: "", comment: "" });
  const [selectedListForReview, setSelectedListForReview] = useState("");
  const [expandedList, setExpandedList] = useState(null);

  const token = localStorage.getItem("token");
  const loggedInUserId = localStorage.getItem("userId");

  useEffect(() => {
    fetchPublicLists();
    fetchPrivateLists();
    fetchUserLists();
  }, []);

  const fetchPublicLists = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/public-lists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch public destination lists");
      }
      const data = await response.json();
      setPublicLists(data);
    } catch (error) {
      console.error("Error fetching public lists:", error);
      setErrorMessage("Error fetching public destination lists");
    }
  };

  const fetchPrivateLists = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/private-lists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch private lists");
      }
      const data = await response.json();
      setPrivateLists(data);
    } catch (error) {
      console.error("Error fetching private lists:", error);
      setErrorMessage("Error fetching private lists");
    }
  };

  const fetchUserLists = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/lists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user-created lists");
      }
      const data = await response.json();
      setUserLists(data);
    } catch (error) {
      console.error("Error fetching user lists:", error);
      setErrorMessage("Error fetching user lists");
    }
  };

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

  const handleToggleExpand = (destinationId) => {
    setSearchResults((prevResults) =>
      prevResults.map((destination) =>
        destination._id === destinationId
          ? { ...destination, expanded: !destination.expanded }
          : destination
      )
    );
  };

  const handleAddToList = async (destinationId) => {
    if (userLists.length === 0) {
      alert("Please create a list first before adding destinations.");
      return;
    }

    const selectedListId = prompt(
      "Enter the name of the list to add this destination:"
    );
    const list = userLists.find((list) => list.name === selectedListId);

    if (!list) {
      alert("List not found. Make sure the name is correct.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/lists/${list._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            destinations: [...list.destinations, destinationId],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add destination to list");
      }

      alert("Destination added to the list successfully!");
      fetchUserLists();
      fetchPrivateLists();
    } catch (error) {
      console.error("Error adding destination to list:", error);
      setErrorMessage("Error adding destination to list");
    }
  };

  const handleCreateList = async () => {
    if (!newList.name.trim()) {
      alert("List name is required");
      return;
    }

    if (userLists.some((list) => list.name === newList.name)) {
      alert("List name must be unique");
      return;
    }

    if (userLists.length >= 20) {
      alert("You can only create up to 20 lists");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newList.name,
          description: newList.description || "",
          visibility: newList.visibility,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create list");
      }

      alert("List created successfully!");
      setNewList({ name: "", description: "", visibility: "private" });
      fetchUserLists();
      fetchPrivateLists();
    } catch (error) {
      console.error("Error creating list:", error);
      setErrorMessage(error.message);
    }
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReview((prevReview) => ({
      ...prevReview,
      [name]: value,
    }));
  };

  const handleAddReview = async () => {
    if (!review.rating || !selectedListForReview) {
      alert("Rating and a selected list are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Unauthorized: Please log in first");
      }

      const response = await fetch(
        `http://localhost:3000/api/lists/${selectedListForReview}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(review),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add review");
      }

      alert("Review added successfully!");
      setReview({ rating: "", comment: "" });

      const listResponse = await fetch(
        `http://localhost:3000/api/lists/${selectedListForReview}/details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (listResponse.ok) {
        const updatedList = await listResponse.json();

        setUserLists((prevLists) =>
          prevLists.map((list) =>
            list._id === selectedListForReview ? updatedList : list
          )
        );
      } else {
        throw new Error("Failed to fetch updated list details");
      }
    } catch (error) {
      console.error("Error adding review:", error);
      setErrorMessage(error.message);
    }
  };

  const toggleListExpansion = async (listId) => {
    if (expandedList === listId) {
      setExpandedList(null);
      return;
    }

    try {
      console.log("Fetching details for listId:", listId);
      const response = await fetch(
        `http://localhost:3000/api/lists/${listId}/details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch list details");
      }

      const data = await response.json();
      setExpandedList(listId);

      setUserLists((prevLists) =>
        prevLists.map((list) =>
          list._id === listId ? { ...list, ...data } : list
        )
      );
    } catch (error) {
      console.error("Error expanding list:", error);
      setErrorMessage("Failed to expand list details");
    }
  };
  const handleDeleteList = async (listId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/lists/${listId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete list");
      }

      alert("List deleted successfully!");
      fetchUserLists();
      fetchPrivateLists();
    } catch (error) {
      console.error("Error deleting list:", error);
      setErrorMessage("Error deleting list");
    }
  };
  const handleDeleteReview = async (reviewId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete review");
      }

      alert("Review deleted successfully!");
      fetchUserLists();
    } catch (error) {
      console.error("Error deleting review:", error);
      setErrorMessage("Error deleting review");
    }
  };

  return (
    <div className="homepage-container">
      <h1>Welcome to Your Homepage!</h1>
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
              <button onClick={() => handleToggleExpand(destination._id)}>
                {destination.expanded ? "Hide Details" : "View Details"}
              </button>
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
              <button onClick={() => handleAddToList(destination._id)}>
                Add to List
              </button>
              {destination.expanded && (
                <div className="destination-details">
                  <p>Region: {destination.Region || "Unknown Region"}</p>
                  <p>Category: {destination.Category || "Unknown Category"}</p>
                  <p>
                    Coordinates:{" "}
                    {destination.coordinates
                      ? `${destination.coordinates.latitude || "N/A"}, ${
                          destination.coordinates.longitude || "N/A"
                        }`
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

      <div className="create-list-container">
        <h2>Create a New List</h2>
        <div className="create-list-inputs">
          <input
            type="text"
            placeholder="List Name"
            value={newList.name}
            onChange={(e) => setNewList({ ...newList, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Description (Optional)"
            value={newList.description}
            onChange={(e) =>
              setNewList({ ...newList, description: e.target.value })
            }
          />
          <label>
            <input
              type="checkbox"
              checked={newList.visibility === "public"}
              onChange={(e) =>
                setNewList({
                  ...newList,
                  visibility: e.target.checked ? "public" : "private",
                })
              }
            />
            Public Visibility
          </label>
        </div>
        <button onClick={handleCreateList}>Create List</button>
      </div>

      <div className="add-review-container">
        <h2>Add Review to a List</h2>
        <select
          value={selectedListForReview}
          onChange={(e) => setSelectedListForReview(e.target.value)}
        >
          <option value="">Select a list</option>
          {userLists.map((list) => (
            <option key={list._id} value={list._id}>
              {list.name}
            </option>
          ))}
        </select>
        <select
          name="rating"
          value={review.rating}
          onChange={handleReviewChange}
        >
          <option value="">Select Rating (1-5)</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
        <input
          type="text"
          name="comment"
          placeholder="Comment (Optional)"
          value={review.comment}
          onChange={handleReviewChange}
        />
        <button onClick={handleAddReview}>Add Review</button>
      </div>

      <div className="public-lists">
        <h2>Public Destination Lists</h2>
        {publicLists.length > 0 ? (
          publicLists.map((list) => {
            return (
              <div key={list._id} className="public-list-item">
                <h3>{list.name}</h3>
                <p>Creator: {list.creatorNickname}</p>
                <p>Number of Destinations: {list.numDestinations}</p>
                <p>Average Rating: {list.averageRating}</p>
                <button onClick={() => toggleListExpansion(list._id)}>
                  {expandedList === list._id ? "Hide Details" : "View Details"}
                </button>
                {expandedList === list._id && (
                  <div className="list-details">
                    <p>{list.description || "No Description Available"}</p>
                    <div className="destinations">
                      <h4>Destinations:</h4>
                      {list.destinations.map((destination) => (
                        <div key={destination._id} className="destination-item">
                          <p>
                            <strong>{destination.Destination}</strong> -{" "}
                            {destination.Region}, {destination.Country}
                          </p>
                          <p>Category: {destination.Category}</p>
                          <p>
                            Coordinates:{" "}
                            {destination.coordinates?.latitude || "N/A"},{" "}
                            {destination.coordinates?.longitude || "N/A"}
                          </p>
                          <p>Currency: {destination.Currency || "Unknown"}</p>
                          <p>Language: {destination.Language || "Unknown"}</p>
                          <p>Safety: {destination.Safety || "Unknown"}</p>
                          <p>
                            Description:{" "}
                            {destination.Description ||
                              "No Description Available"}
                          </p>
                        </div>
                      ))}
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
                              {review.user &&
                                review.user._id === loggedInUserId && (
                                  <button
                                    onClick={() =>
                                      handleDeleteReview(review._id)
                                    }
                                  >
                                    Delete Review
                                  </button>
                                )}
                            </div>
                          );
                        })
                      ) : (
                        <p>No reviews yet.</p>
                      )}
                    </div>
                    {list.creatorId?.toString() === loggedInUserId && (
                      <button onClick={() => handleDeleteList(list._id)}>
                        Delete List
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p>No public lists available</p>
        )}
      </div>

      <div className="private-lists">
        <h2>Your Private Lists</h2>
        {privateLists.length > 0 ? (
          privateLists.map((list) => (
            <div key={list._id} className="private-list-item">
              <h3>{list.name}</h3>
              <p>
                Description: {list.description || "No Description Available"}
              </p>
              <p>Number of Destinations: {list.destinations.length}</p>
              <button onClick={() => toggleListExpansion(list._id)}>
                {expandedList === list._id ? "Hide Details" : "View Details"}
              </button>
              {expandedList === list._id && (
                <div className="list-details">
                  <div className="destinations">
                    <h4>Destinations:</h4>
                    {list.destinations.map((destination) => (
                      <div key={destination._id} className="destination-item">
                        <p>
                          <strong>{destination.Destination}</strong> -{" "}
                          {destination.Region}, {destination.Country}
                        </p>
                        <p>Category: {destination.Category}</p>
                        <p>
                          Coordinates:{" "}
                          {destination.coordinates?.latitude || "N/A"},{" "}
                          {destination.coordinates?.longitude || "N/A"}
                        </p>
                        <p>Currency: {destination.Currency || "Unknown"}</p>
                        <p>Language: {destination.Language || "Unknown"}</p>
                        <p>Safety: {destination.Safety || "Unknown"}</p>
                        <p>
                          Description:{" "}
                          {destination.Description ||
                            "No Description Available"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => handleDeleteList(list._id)}>
                    Delete List
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No private lists available</p>
        )}
      </div>
    </div>
  );
};
