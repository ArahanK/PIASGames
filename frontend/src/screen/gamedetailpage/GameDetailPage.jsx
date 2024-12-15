import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Footer from '../../components/Footer';
import Header from '../../screen/homepage/Header';
import axios from 'axios';

function GameDetailPage() {
    const { id } = useParams();
    const [game, setGame] = useState(null);
    const [imageUrls, setImageUrls] = useState(['/placeholder.jpg']);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [alert, setAlert] = useState(null);

    // User info state
    const [userInfo, setUserInfo] = useState(null);

    // Fetch signed URLs for images
    const fetchSignedUrls = async (images) => {
        const signedUrlPromises = images.map(async (image) => {
            let fileName = image.imageUrl;
            if (fileName.includes('/')) {
                fileName = fileName.split('/').pop();
            }
            fileName = decodeURIComponent(fileName);

            try {
                const response = await fetch(
                    `http://localhost:3000/generate-signed-url?bucketName=product-images&fileName=${encodeURIComponent(fileName)}`
                );
                if (!response.ok) {
                    console.error('Failed to fetch signed URL:', await response.text());
                    return '/placeholder.jpg';
                }

                const data = await response.json();
                return data.signedUrl;
            } catch (err) {
                console.error('Error fetching signed URL:', err);
                return '/placeholder.jpg';
            }
        });

        return Promise.all(signedUrlPromises);
    };

    // Fetch user profile to determine login state
    const fetchUserProfile = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/users/profile`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            setUserInfo(response.data);
        } catch (error) {
            setUserInfo(null); // If fetching fails, user is not logged in
        }
    };

    useEffect(() => {
        const fetchGame = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/products/get/${id}`);
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();

                setGame(data);

                if (data.images && data.images.length > 0) {
                    const urls = await fetchSignedUrls(data.images);
                    setImageUrls(urls);
                } else {
                    setImageUrls(['/placeholder.jpg']);
                }
            } catch (err) {
                console.error('Error fetching game details:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGame();
        fetchUserProfile(); // Check if user is logged in
    }, [id]);

    const handleAddToCart = async () => {
        const { userId, token } = userInfo || {};

        if (!userId || !token) {
            console.log('Guest user detected.');
            const tempCart = JSON.parse(localStorage.getItem('tempCart')) || [];
            const existingItemIndex = tempCart.findIndex(item => item.id === game.productId);
            if (existingItemIndex !== -1) {
                tempCart[existingItemIndex].quantity += quantity;
            } else {
                const newItem = {
                    cartItemId: game.productId,
                    id: game.productId,
                    name: game.name,
                    price: game.price,
                    quantity,
                    imageUrl: imageUrls[0],
                };
                tempCart.push(newItem);
            }

            localStorage.setItem('tempCart', JSON.stringify(tempCart));
            alert('Item added to cart (Temporary Cart)');
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:8080/api/cart-items/cart/${userId}/item/${game.productId}/add?quantity=${quantity}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                alert('Item added to cart successfully!');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add item to cart');
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleAddToWishlist = async () => {
        if (!userInfo || !userInfo.userId) {
            setAlert('Please log in to add this game to your wishlist.');
            return;
        }

        const authToken = localStorage.getItem('authToken');

        try {
            let wishlistId = localStorage.getItem('wishlistId');

            if (!wishlistId) {
                const createResponse = await fetch(`http://localhost:8080/api/wishlist/create/${userInfo.userId}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });

                if (!createResponse.ok) {
                    throw new Error('Failed to create wishlist.');
                }

                const newWishlist = await createResponse.json();
                wishlistId = newWishlist.wishlistID;
                localStorage.setItem('wishlistId', wishlistId);
            }

            const response = await fetch(`http://localhost:8080/api/wishlist/add/${wishlistId}/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to add to wishlist.');
            }

            setAlert('Game added to your wishlist!');
        } catch (err) {
            console.error('Error adding to wishlist:', err);
            setAlert('Error adding game to wishlist.');
        }
    };

    const handleQuantityChange = (e) => {
        const value = e.target.value === '' ? '' : Math.max(1, Math.min(game.stock, Number(e.target.value)));
        setQuantity(value);
    };

    const handleBlur = () => {
        if (quantity === '' || quantity < 1) {
            setQuantity(1);
        }
    };

    const incrementQuantity = () => {
        setQuantity((prev) => Math.min(prev + 1, game.stock));
    };

    const decrementQuantity = () => {
        setQuantity((prev) => Math.max(prev - 1, 1));
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center text-xl">Loading...</div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center text-red-500 text-xl">Error: {error}</div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!game) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center text-xl">Game not found.</div>
                </div>
                <Footer />
            </div>
        );
    }

    const categoriesText = (Array.isArray(game.categoryList) && game.categoryList.length > 0)
        ? game.categoryList.map(cat => cat.name).join(', ')
        : 'No categories';

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow flex items-center justify-center">
                <div className="max-w-4xl w-full p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative w-full flex flex-col items-center justify-center">
                            <div className="relative w-full h-[400px] flex items-center justify-center">
                                <button
                                    onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1))}
                                    className="absolute left-0 bg-gray-200 text-gray-800 px-2 py-1 rounded-full hover:bg-gray-300"
                                >
                                    &#8249;
                                </button>
                                <img
                                    src={imageUrls[currentImageIndex]}
                                    alt={`${game.name} Image ${currentImageIndex + 1}`}
                                    className="w-full h-full object-contain rounded-md p-2"
                                />
                                <button
                                    onClick={() => setCurrentImageIndex((prevIndex) => (prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1))}
                                    className="absolute right-0 bg-gray-200 text-gray-800 px-2 py-1 rounded-full hover:bg-gray-300"
                                >
                                    &#8250;
                                </button>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                Image {currentImageIndex + 1}/{imageUrls.length}
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                            <h1 className="text-3xl font-bold">{game.name}</h1>
                            <p className="text-md text-gray-600 mt-2">Developer: {game.developer}</p>
                            <p className="text-lg font-bold text-gray-800 mt-2">${game.price.toFixed(2)}</p>
                            <p className="text-sm text-gray-600 mt-1">Quantity Available: {game.stock}</p>
                            <p className="text-sm text-gray-600 mt-1">Platform: {game.platform}</p>
                            <p className="text-sm text-gray-600 mt-1">Categories: {categoriesText}</p>
                            <p className="text-md text-gray-800 mt-4">{game.description}</p>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Quantity:
                                </label>
                                <div className="flex items-center mt-2 space-x-2">
                                    <button
                                        onClick={decrementQuantity}
                                        className="px-2 py-1 border rounded-md bg-gray-200 hover:bg-gray-300"
                                        disabled={quantity <= 1}
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        min="1"
                                        max={game.stock}
                                        onChange={handleQuantityChange}
                                        onBlur={handleBlur}
                                        className="w-20 p-2 text-center border border-gray-300 rounded-md"
                                    />
                                    <button
                                        onClick={incrementQuantity}
                                        className="px-2 py-1 border rounded-md bg-gray-200 hover:bg-gray-300"
                                        disabled={quantity >= game.stock}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <button
                                className={`bg-blue-500 px-4 py-2 mt-6 rounded text-white hover:bg-blue-700 ${quantity > game.stock ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleAddToCart}
                                disabled={quantity > game.stock}
                            >
                                Add to Cart
                            </button>
                            <button
                                className="bg-green-500 px-4 py-2 mt-2 rounded text-white hover:bg-green-700"
                                onClick={handleAddToWishlist}
                            >
                                Add to Wishlist
                            </button>
                            {alert && <p className="mt-4 text-sm text-red-600">{alert}</p>}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default GameDetailPage;
