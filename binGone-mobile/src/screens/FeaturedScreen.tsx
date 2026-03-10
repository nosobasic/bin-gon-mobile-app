import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  ImageBackground,
} from 'react-native';
import { NavigationProp, ProductCard } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { SearchBar } from '../components';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useData } from '../contexts/DataContext';

interface FeaturedScreenProps {
  navigation: NavigationProp;
}



interface MenuPosition {
  x: number;
  y: number;
}

const FeaturedScreen: React.FC<FeaturedScreenProps> = ({ navigation }) => {
  const { allListings, fetchAllListings } = useData();
  const [searchText, setSearchText] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ x: 0, y: 0 });
  const menuButtonRefs = useRef<{ [key: string]: View | null }>({});

  // Fetch all listings with isPremium filter
  useEffect(() => {
    fetchAllListings({ isPremium: true });
  }, [fetchAllListings]);

  // Filter listings based on search query
  const filteredListings = searchText.trim() 
    ? allListings.filter(listing => 
        listing.title.toLowerCase().includes(searchText.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchText.toLowerCase()) ||
        listing.category?.name.toLowerCase().includes(searchText.toLowerCase())
      )
    : allListings;

  // Convert listings to ProductCard format
  const featuredProducts: ProductCard[] = filteredListings.map(listing => {
    // Handle image properly - ensure it's a string URL or use fallback
    let imageSource;
    if (listing.images && listing.images.length > 0 && typeof listing.images[0] === 'string') {
      imageSource = { uri: listing.images[0] };
    } else {
      imageSource = require('../assets/images/feature.png');
    }

    return {
      id: listing.id,
      coordinates: listing.location?.coordinates,
      image: imageSource,
      images: listing.images || [], // Store all images for detail view
      category: listing.category?.name || 'General',
      title: listing.title,
      description: listing.description,
      location: listing.address || 'Unknown Location',
      distance: '1.2 mi',
      isFavorite: false,
      donorName: listing.donorName || 'Anonymous Donor',
    };
  });

  const handleMenuPress = (productId: string) => {
    const buttonRef = menuButtonRefs.current[productId];
    if (buttonRef) {
      buttonRef.measureInWindow((x: number, y: number, width: number, height: number) => {
        setMenuPosition({
          x: x + width - wp(35), // Align right edge of menu with right edge of button
          y: y + height// Position below the button with small gap
        });
        setSelectedProduct(productId);
        setShowMenu(true);
      });
    }
  };

  const handleMenuClose = () => {
    setShowMenu(false);
    setSelectedProduct(null);
  };

  const handleMenuAction = (action: string) => {
    console.log(`Action: ${action} for product: ${selectedProduct}`);
    handleMenuClose();
  };

  const toggleFavorite = (productId: string) => {
    // In a real app, this would update the state
    console.log(`Toggle favorite for product: ${productId}`);
  };

  const renderProductCard = ({ item }: { item: ProductCard }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
      activeOpacity={0.8}
    >
      <View style={styles.cardImageContainer}>
        <ImageBackground
          source={item.image}
          style={styles.cardImage}
          imageStyle={styles.cardImageStyle}
        >
          <View style={styles.cardOverlay}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{item.category}</Text>
            </View>
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={(e) => {
                e.stopPropagation();
                toggleFavorite(item.id);
              }}
            >
              <Text style={styles.favoriteIcon}>♡</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.productHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <TouchableOpacity 
            ref={(ref) => {
              menuButtonRefs.current[item.id] = ref;
            }}
            style={styles.menuButton}
            onPress={(e) => {
              e.stopPropagation();
              handleMenuPress(item.id);
            }}
          >
            <Text style={styles.menuIcon}>⋯</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardDescription}>{item.description}</Text>
        
        <View style={styles.locationContainer}>
          <Image 
            source={require('../assets/images/location.png')}
            style={styles.locationIcon}
            resizeMode="contain"
          />
          <Text style={styles.locationText}>
            {item.location}, {item.distance}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="other" 
        title="All Featured" 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            placeholder="Search here..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        {/* Products List */}
        <View style={styles.productsSection}>
          <FlatList
            data={featuredProducts}
            renderItem={renderProductCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        </View>

        <View style={{ height: wp(20) }} />
      </ScrollView>

      {/* Popup Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={handleMenuClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={handleMenuClose}
        >
          <View style={[styles.menuContainer, { 
            position: 'absolute',
            top: menuPosition.y,
            left: menuPosition.x,
          }]}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuAction('edit')}
            >
              <Image 
                source={require('../assets/images/edit.png')}
                style={styles.menuItemIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuAction('delete')}
            >
              <Image 
                source={require('../assets/images/delete.png')}
                style={styles.menuItemIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Delete</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuAction('collected')}
            >
              <Image 
                source={require('../assets/images/collected.png')}
                style={styles.menuItemIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuText}>Collected</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
  searchSection: {
  },
  productsSection: {
    paddingHorizontal: wp(5),
  },
  productsList: {
    gap: wp(4),
  },
  productCard: {
    width: wp(90),
    padding: wp(5),
    paddingBottom: wp(3),
    borderRadius: wp(4),
    overflow: 'hidden',
    marginRight: wp(3),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(1),
    },
    shadowOpacity: 0.15,
    shadowRadius: wp(1.5),
    backgroundColor: "#F6F6F6",
    marginBottom: wp(3),
  },
  cardImageContainer: {
    width: wp(80),
    height: wp(40),
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp(4),
  },
  cardImageStyle: {
    borderRadius: wp(4),
  },
  cardOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: wp(3),
    borderRadius: wp(4),
    flexDirection: "row",
  },
  categoryTag: {
    backgroundColor: colors.primary,
    paddingVertical: wp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(3),
    alignSelf: 'flex-start',
  },
  categoryTagText: {
    color: colors.white,
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_MEDIUM,
  },
  favoriteButton: {
    width: wp(8),
    height: wp(8),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'rgba(162, 162, 162, 1)',
    borderRadius: wp(5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  favoriteIcon: {
    fontSize: wp(5),
    color: colors.black,
  },
  cardContent: {
    padding: wp(2),
    borderTopLeftRadius: wp(4),
    borderTopRightRadius: wp(4),
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: wp(1),
  },
  cardTitle: {
    fontSize: wp(4.2),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.black,
    marginBottom: wp(1),
    marginTop: wp(2)
  },
  menuButton: {
    padding: wp(1),
  },
  menuIcon: {
    fontSize: wp(4.5),
    color: colors.text.gray,
    transform: [{ rotate: '90deg' }],
  },
  cardDescription: {
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    marginBottom: wp(1),
    lineHeight: wp(4.5),
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: wp(1),
  },
  locationIcon: {
    width: wp(4),
    height: wp(4),
    marginRight: wp(2),
    tintColor: colors.gray.medium,
  },
  locationText: {
    fontSize: wp(2.8),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
    marginTop: wp(0.5)
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: wp(3),
    paddingVertical: wp(2),
    minWidth: wp(25),
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: wp(2),
  },
  menuText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.text.gray,
    marginTop: wp(1)
  },
  menuItemIcon: {
    width: wp(5.5),
    height: wp(5.5),
    marginRight: wp(2.5),
  },
});

export default FeaturedScreen; 