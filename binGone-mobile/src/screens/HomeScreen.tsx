import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { NavigationProp } from '../types/navigation';
import AppHeader from '../components/AppHeader';
import { 
  DonationCard, 
  ImpactCard, 
  CategoryButton, 
  SearchBar, 
  CallToActionCard, 
  SectionHeader 
} from '../components';
import { colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { widthPercentageToDP as wp} from 'react-native-responsive-screen';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

interface HomeScreenProps {
  navigation: NavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { categories, listings, allListings, fetchAllListings } = useData();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchAllListings({ isPremium: true });
  }, [fetchAllListings]);



  // Function to get category icon from category data or fallback to default
  const getCategoryIcon = (category: any) => {
    const iconMap: { [key: string]: any } = {
      'Education': require('../assets/images/education.png'),
      'Food': require('../assets/images/food.png'),
      'Clothes': require('../assets/images/clothes.png'),
      'Medical': require('../assets/images/medical.png'),
      'Stationery': require('../assets/images/stationery.png'),
      'Athletic': require('../assets/images/athletic.png'),
      'Book': require('../assets/images/book.png'),
      'Category': require('../assets/images/category.png'),
    };
    return iconMap[category.icon] || iconMap[category.name] || require('../assets/images/category.png');
  };

  // Filter listings based on search query
  const filteredListings = searchQuery.trim() 
    ? allListings.filter(listing => 
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allListings;

  // Convert listings to featured donations format
  const featuredDonations = (isSearching ? filteredListings : filteredListings.slice(0, 5)).map(listing => {
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
      location: `${listing.address || 'Unknown Location'}, 1.2 mi`,
      donorName: listing.donorName || 'Anonymous Donor',
      donorInitials: (listing.donorName || 'A').split(' ').map(n => n[0]).join('').toUpperCase(),
    };
  });

  // Search handlers
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setIsSearching(text.trim().length > 0);
  };

  const handleSearchSubmit = () => {
    // Search is already active when typing, this can be used for additional actions
    console.log('Search submitted:', searchQuery);
  };

  const impactCards = [
    {
      id: 1,
      icon: '👕',
      title: 'Give What You Don\'t Need',
      description: 'Clear your closet and help others by donating clothes you no longer wear.',
    },
    {
      id: 2,
      icon: '📍',
      title: 'Local Connections',
      description: 'Connect with people in your neighborhood who need what you have to offer.',
    },
    {
      id: 3,
      icon: '🌍',
      title: 'Reduce Waste',
      description: 'Keep clothes out of landfills and reduce environmental impact through reuse.',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        type="home" 
        title="binGone" 
        onLocationPress={() => navigation.navigate('Map')}
      />
      
      <ScrollView style={styles.content}>
        {/* Donation Campaign Section */}
        <View style={styles.donationSection}>
          {/* Headline */}
          {/* Every Smile Begins 
          with Hope. We're Here. */}
          {
             (user?.accountType === 'receiver' || user?.roleId === 2) && (
              <View style={styles.headlineContainer}>
              <Text style={styles.headline}>
                <Text style={styles.headlineNormal}>Every </Text>
                <Text style={styles.headlinePrimary}>Smile </Text>
                <Text style={styles.headlineNormal}>Begins</Text>
              </Text>
              <Text style={styles.headline}>
                <Text style={styles.headlineNormal}>with Hope. We're </Text>
                <Text style={styles.headlineSecondary}>Here</Text>
                <Text style={styles.headlineNormal}>.</Text>
              </Text>
            </View>
             )}
          
          {(user?.accountType === 'donor' || user?.roleId === 1) && (
            <View style={styles.headlineContainer}>
            <Text style={styles.headline}>
              <Text style={styles.headlineNormal}>Be the </Text>
              <Text style={styles.headlinePrimary}>Reason</Text>
            </Text>
            <Text style={styles.headline}>
              <Text style={styles.headlineNormal}>Someone </Text>
              <Text style={styles.headlineSecondary}>Smiles</Text>
              <Text style={styles.headlineNormal}> Today</Text>
            </Text>
          </View>
          )}



          {/* Call to Action Cards - Conditionally rendered based on user role */}
          {/* First Card: "Support is Here — Because You Matter" - Only for receivers */}
          {(user?.accountType === 'receiver' || user?.roleId === 2) && (
            <CallToActionCard
              backgroundImage={require('../assets/images/home_bg.jpg')}
              title="Support is Here — Because You Matter"
              buttonText="Donations Near You"
              onButtonPress={() => {
                navigation.navigate('Map');
              }}
            />
          )}
          
          {/* Second Card: "Your small act can mean the world" - Only for donors */}
          {(user?.accountType === 'donor' || user?.roleId === 1) && (
            <CallToActionCard
              backgroundImage={require('../assets/images/home_bg.jpg')}
              title="Your small act can mean the world."
              buttonText="Start Donating Today"
              onButtonPress={() => {
                navigation.navigate('CreateDonation');
              }}
            />
          )}
          
          {/* Fallback: Show both cards if user is not logged in or no role information */}
          {(!user || (!user.accountType && !user.roleId)) && (
            <>
              <CallToActionCard
                backgroundImage={require('../assets/images/home_bg.jpg')}
                title="Support is Here — Because You Matter"
                buttonText="Donations Near You"
                onButtonPress={() => {
                  navigation.navigate('Map');
                }}
              />
              <CallToActionCard
                backgroundImage={require('../assets/images/home_bg.jpg')}
                title="Your small act can mean the world."
                buttonText="Start Donating Today"
                onButtonPress={() => {
                  navigation.navigate('CreateDonation');
                }}
              />
            </>
          )}
        </View>

        {/* Search and Categories Section */}
        <View style={styles.searchSection}>
          {/* Search Bar */}
          <SearchBar 
            placeholder="Search donations..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
          />

          {/* Categories */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <CategoryButton
                key={category.id}
                name={category.name}
                imageIcon={getCategoryIcon(category)}
                onPress={() => {
                  // Navigate to Categories tab with the selected category
                  navigation.navigate('Dashboard', { 
                    initialTab: 'Categories',
                    selectedCategoryId: category.id 
                  });
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Donations Section */}
        <View style={styles.featuredSection}>
          {/* Section Header */}
          <SectionHeader
            title={isSearching ? `Search Results (${featuredDonations.length})` : "Impactful Featured Donations"}
            showSeeAll={!isSearching}
            onSeeAllPress={() => {
              console.log('See All pressed from HomeScreen - navigating to Donation screen');
              navigation.navigate('Donation');
            }}
          />

                     {/* Featured Donations Cards */}
           {isSearching && featuredDonations.length === 0 ? (
             <View style={styles.noResultsContainer}>
               <Text style={styles.noResultsText}>No donations found for "{searchQuery}"</Text>
               <Text style={styles.noResultsSubtext}>Try searching with different keywords</Text>
             </View>
           ) : (
             <ScrollView 
               horizontal 
               showsHorizontalScrollIndicator={false}
               style={styles.featuredCardsContainer}
               contentContainerStyle={styles.featuredCardsContent}
             >
               {featuredDonations.map((donation) => (
              <DonationCard
                key={donation.id}
                image={donation.image}
                category={donation.category}
                title={donation.title}
                description={donation.description}
                location={donation.location}
                donorName={donation.donorName}
                donorInitials={donation.donorInitials}
                onPress={() => {
                  // Convert donation to ProductCard format and navigate
                  const productCard = {
                    id: donation.id.toString(),
                    title: donation.title,
                    description: donation.description,
                    category: donation.category,
                    location: donation.location.split(',')[0], // Get just the area name
                    distance: donation.location.split(',').slice(-1)[0].trim(), // Get the distance
                    image: donation.image,
                    images: donation.images || [], // Include all images for gallery
                    isFavorite: false,
                    donorName: donation.donorName,
                    coordinates: donation.coordinates,
                  };
                  navigation.navigate('ProductDetail', { product: productCard });
                }}
                                 onFavoritePress={() => {
                   // Handle favorite press
                   console.log('Favorite pressed for donation:', donation.id);
                 }}
               />
             ))}
             </ScrollView>
           )}
        </View>

        {/* Community Impact Section */}
        <View style={styles.communitySection}>
          {/* Section Header */}
          <View style={styles.communityHeader}>
            <Text style={styles.communityTitle}>
              <Text style={styles.communityTitleNormal}>Make an </Text>
              <Text style={styles.communityTitleHighlight}>Impact</Text>
              <Text style={styles.communityTitleNormal}> in Your Community</Text>
            </Text>
          </View>

          {/* Impact Cards */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.impactCardsContainer}
            contentContainerStyle={styles.impactCardsContent}
          >
            {impactCards.map((impact) => (
              <ImpactCard
                key={impact.id}
                icon={impact.icon}
                title={impact.title}
                description={impact.description}
              />
            ))}
          </ScrollView>

          {/* Call to Action Button */}
          {
            user?.accountType === 'donor' || user?.roleId === 1 && (
              <TouchableOpacity 
              style={styles.communityCtaButton}
              onPress={() => {
                navigation.navigate('CreateDonation');
              }}
            >
              <Text style={styles.communityCtaText}>Start Donating Today</Text>
            </TouchableOpacity>
            )
          }

           {(user?.accountType === 'receiver' || user?.roleId === 2) && ( 
              <TouchableOpacity 
              style={styles.communityCtaButton}
              onPress={() => {
                navigation.navigate('Map');
              }}
            >
              <Text style={styles.communityCtaText}>Donations Near You</Text>
            </TouchableOpacity>
           )}
         
        </View>

        <View style={{height: wp(25)}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingBottom: wp(20)
  },
  donationSection: {
    padding: wp(5),
    marginBottom: wp(5),
  },
  headlineContainer: {
    backgroundColor: colors.white,
    marginBottom: wp(4),
  },
  headline: {
    fontSize: wp(7.2),
    lineHeight: wp(8.5),
    fontFamily: Fonts.MONTSERRAT_REGULAR,
  },
  headlineNormal: {
    color: colors.black,
  },
  headlinePrimary: {
    color: colors.primary,
  },
  headlineSecondary: {
    color: colors.secondary,
  },
  searchSection: {
    marginBottom: wp(4),
  },
  categoriesContainer: {
    // No specific styles needed for ScrollView, contentContainerStyle handles it
  },
  categoriesContent: {
    alignItems: 'center',
    paddingLeft: wp(5),
  },
  featuredSection: {
    paddingLeft: wp(5),
    marginBottom: wp(4),
  },
  featuredCardsContainer: {
    // No specific styles needed for ScrollView, contentContainerStyle handles it
  },
  featuredCardsContent: {
    alignItems: 'center',
  },
  communitySection: {
    backgroundColor: colors.primary,
    marginTop: wp(4),
    marginBottom: wp(4),
    paddingVertical: wp(5),
    alignItems: 'center',
  },
  communityHeader: {
    paddingHorizontal: wp(5),
    marginBottom: wp(4),
  },
  communityTitle: {
    fontSize: wp(4.5),
    fontFamily: Fonts.MONTSERRAT_SEMIBOLD,
    color: colors.white,
    textAlign: 'center',
  },
  communityTitleNormal: {
    color: colors.white,
  },
  communityTitleHighlight: {
    color: colors.secondary,
  },
  impactCardsContainer: {
    flexDirection: 'row',
    marginBottom: wp(4),
  },
  impactCardsContent: {
    alignItems: 'center',
  },
  communityCtaButton: {
    backgroundColor: colors.secondary,
    paddingVertical: wp(2.5),
    paddingHorizontal: wp(10),
    borderRadius: wp(6),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: wp(0.5),
    },
    shadowOpacity: 0.25,
    shadowRadius: wp(1),
    elevation: 5,
    marginHorizontal: wp(5),
  },
  communityCtaText: {
    color: colors.white,
    fontSize: wp(3.3),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    textAlign: 'center',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: wp(8),
    paddingHorizontal: wp(5),
  },
  noResultsText: {
    fontSize: wp(4),
    fontFamily: Fonts.POPPINS_SEMIBOLD,
    color: colors.text.gray,
    textAlign: 'center',
    marginBottom: wp(2),
  },
  noResultsSubtext: {
    fontSize: wp(3.2),
    fontFamily: Fonts.POPPINS_REGULAR,
    color: colors.gray.medium,
    textAlign: 'center',
  },
});

export default HomeScreen; 