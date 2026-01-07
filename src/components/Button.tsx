import * as React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Entypo} from '@expo/vector-icons';

type ButtonProps = {
    title: string;
    onPress: () => void;
    icon: React.ComponentProps<typeof Entypo>['name'];
    color?: string;
};

export default function Button({title, onPress, icon, color}: ButtonProps){
    return (
        <TouchableOpacity onPress={onPress} style={styles.button}>
            <Entypo name={icon} size={28} color={color ? color: '#f1f1f1'}/>
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>

    );
}

const styles = StyleSheet.create({
    button: {
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: 'bold',
        color: '#f1f1f1',
        fontSize: 16,
        marginLeft: 10,
    },
})