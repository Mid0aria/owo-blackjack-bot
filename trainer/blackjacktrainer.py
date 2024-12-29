"""
OwO BlackJack Bot
Copyright (C) 2024 Mido
This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
For more information, see README.md and LICENSE
"""

import random
import numpy as np
import json


def calculate_hand_value(hand):
    """Calculate the total value of the hand (Aces require special handling)."""
    value = sum(card if card != 1 else 11 for card in hand)
    ace_count = hand.count(1)

    while value > 21 and ace_count:
        value -= 10
        ace_count -= 1

    return value


def deal_card():
    """Draws a card (gives a value between 1-11)."""
    card = random.choice([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10])
    return card


def is_blackjack(hand):
    """If it made a hand of Blackjack (21), return True."""
    return calculate_hand_value(hand) == 21


class QLearningAgent:
    def __init__(self, actions, epsilon=0.1, alpha=0.1, gamma=0.9):
        self.actions = actions
        self.epsilon = epsilon
        self.alpha = alpha
        self.gamma = gamma
        self.q_table = {}

    def get_q_value(self, state, action):
        """Get the Q-value for the given state and action."""
        if state not in self.q_table:
            self.q_table[state] = [0] * len(self.actions)
        return self.q_table[state][action]

    def update_q_value(self, state, action, reward, next_state):
        """Update the Q-value."""
        old_q_value = self.get_q_value(state, action)
        max_next_q_value = max(self.q_table.get(next_state, [0] * len(self.actions)))
        new_q_value = old_q_value + self.alpha * (
            reward + self.gamma * max_next_q_value - old_q_value
        )
        self.q_table[state][action] = new_q_value

    def choose_action(self, state):
        """Choose action with the Epsilon-greedy method."""
        if random.random() < self.epsilon:
            return random.choice(self.actions)
        else:
            return np.argmax(self.q_table.get(state, [0] * len(self.actions)))

    @staticmethod
    def epsilon_decay(epsilon, decay_rate=0.995, min_epsilon=0.01):
        return max(min_epsilon, epsilon * decay_rate)


def train_agent(agent, episodes=10000):
    epsilon = 1.0
    for episode in range(episodes):

        player_hand = [deal_card(), deal_card()]
        dealer_hand = [deal_card(), deal_card()]

        state = (calculate_hand_value(player_hand), dealer_hand[0], 1 in player_hand)

        done = False
        total_reward = 0

        while not done:
            action = agent.choose_action(state)

            if action == 1:
                player_hand.append(deal_card())
            player_value = calculate_hand_value(player_hand)

            if player_value > 21:
                reward = -1
                done = True
            elif action == 0:
                dealer_value = calculate_hand_value(dealer_hand)
                while dealer_value < 17:
                    dealer_hand.append(deal_card())
                    dealer_value = calculate_hand_value(dealer_hand)

                if dealer_value > 21 or player_value > dealer_value:
                    reward = 1
                elif player_value < dealer_value:
                    reward = -1
                else:
                    reward = 0
                done = True

            next_state = (
                calculate_hand_value(player_hand),
                dealer_hand[0],
                1 in player_hand,
            )

            agent.update_q_value(state, action, reward, next_state)

            state = next_state
            total_reward += reward

        epsilon = agent.epsilon_decay(epsilon)

        if episode % 1000 == 0:
            print(f"Episode {episode}/{episodes} - Total prize: {total_reward}")


actions = [0, 1]  # 0: stop, 1: hand
agent = QLearningAgent(actions)

train_agent(agent, 100000000)


with open("q_values.json", "w") as json_file:
    str_q_table = {
        str([dealerShow, playerSum, 1 if hasAce else 0]): q_values
        for (dealerShow, playerSum, hasAce), q_values in agent.q_table.items()
    }
    json.dump(str_q_table, json_file, indent=4)

print("Q-values were saved in a JSON file.")
